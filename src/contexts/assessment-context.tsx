// src/contexts/assessment-context.tsx

import React, { createContext, useContext, useState, ReactNode, useEffect, useCallback } from 'react';
import apiFetch from "@/services/apiService";

export interface Assessment {
  id: number | null;
  stringId: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  category?: string;
  type?: string;
  questionnaireId?: number | null;
  display_order?: number;
  accentColor?: string | null;
}

interface AssessmentContextType {
  assessments: Assessment[];
  currentAssessment: Assessment | null;
  isLoading: boolean;
  error: string | null;
  completedCount: number;
  fetchAssessments: () => Promise<void>;
  updateAssessmentStatus: (id: string, status: Assessment['status']) => void;
  getNextAssessment: () => Assessment | null;
  getCurrentAssessmentIndex: () => number;
}

const AssessmentContext = createContext<AssessmentContextType | undefined>(undefined);

export const AssessmentProvider = ({ children }: { children: ReactNode }) => {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAssessments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch('assessment/status');
      if (response.success) {
        // const data = Array.isArray(response.data) ? response.data : [];
        const list = Array.isArray(response.data) ? (response.data as Assessment[]) : [];
        const filtered = list.filter((item) => item.type !== 'mystery');
        setAssessments(filtered);
      } else {
        throw new Error(response.message || 'خطا در دریافت اطلاعات ارزیابی‌ها');
      }
    } catch (err: any) {
      setError(err.message);
      // The apiFetch service will now handle the redirect on 401
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    // *** FIX APPLIED HERE ***
    // We check the 'isLoggedIn' flag to decide whether to fetch data.
    if (localStorage.getItem('isLoggedIn')) {
      fetchAssessments();
    } else {
      setIsLoading(false);
    }
  }, [fetchAssessments]);

  const updateAssessmentStatus = (id: string, status: Assessment['status']) => {
    setAssessments(prev => {
      const newAssessments = prev.map(assessment =>
        assessment.stringId === id ? { ...assessment, status } : assessment
      );

      if (status === 'completed') {
        const currentIndex = newAssessments.findIndex(a => a.stringId === id);
        if (currentIndex !== -1 && currentIndex < newAssessments.length - 1 && newAssessments[currentIndex + 1].status === 'locked') {
          newAssessments[currentIndex + 1].status = 'current';
        }
      }

      return newAssessments;
    });
  };

  const getCurrentAssessmentIndex = () => {
    return assessments.findIndex(a => a.status === 'current');
  };

  const getNextAssessment = () => {
    const currentIndex = getCurrentAssessmentIndex();
    return currentIndex !== -1 && currentIndex < assessments.length - 1 ? assessments[currentIndex + 1] : null;
  };

  const currentAssessment = assessments.find(a => a.status === 'current') || null;
  const completedCount = assessments.filter(a => a.status === 'completed').length;

  return (
    <AssessmentContext.Provider value={{
      assessments,
      currentAssessment,
      isLoading,
      error,
      completedCount,
      fetchAssessments,
      updateAssessmentStatus,
      getNextAssessment,
      getCurrentAssessmentIndex
    }}>
      {children}
    </AssessmentContext.Provider>
  );
};

export const useAssessment = () => {
  const context = useContext(AssessmentContext);
  if (context === undefined) {
    throw new Error('useAssessment must be used within an AssessmentProvider');
  }
  return context;
};
