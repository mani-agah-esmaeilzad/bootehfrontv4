// src/App.tsx

import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from "@/components/ui/sonner";
import { AssessmentProvider } from './contexts/assessment-context';

// --- Pages ---
import Index from './pages/Index';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AssessmentChat from './pages/AssessmentChat';
import Results from './pages/Results';
import SupplementaryQuestions from './pages/SupplementaryQuestions';
import NotFound from './pages/NotFound';
import OrgPanel from './pages/OrgPanel';
import PersonalityAssessments from './pages/PersonalityAssessments';
import PersonalityAssessmentDetail from './pages/PersonalityAssessmentDetail';
import PersonalityChat from './pages/PersonalityChat';
import PersonalityResultsPage from './pages/PersonalityResults';
import PersonalityForm from './pages/PersonalityForm';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminUserDetail from './pages/admin/AdminUserDetail';
import AdminQuestionnaires from './pages/admin/AdminQuestionnaires';
import EditQuestionnaire from './pages/admin/EditQuestionnaire';
import NewQuestionnaire from './pages/admin/NewQuestionnaire';
import AdminReports from './pages/admin/AdminReports';
import AdminReportDetail from './pages/admin/AdminReportDetail';
import AdminOrganizations from './pages/admin/AdminOrganizations';
import AdminPersonalityAssessments from './pages/admin/AdminPersonalityAssessments';
import AdminPersonalityResults from './pages/admin/AdminPersonalityResults';
import AdminBlogs from './pages/admin/AdminBlogs';

// --- Route Protection Components ---

const UserPrivateRoute = () => {
  const isAuthenticated = !!localStorage.getItem('isLoggedIn');
  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};

const AdminPrivateRoute = () => {
  const isAdminAuthenticated = !!localStorage.getItem('isAdminLoggedIn');
  return isAdminAuthenticated ? <Outlet /> : <Navigate to="/admin/login" replace />;
};

function App() {
  return (
    <AssessmentProvider>
      <Router>
        <Routes>
          {/* ====== Public Routes ====== */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/org/:slug" element={<OrgPanel />} />
          <Route path="/personality" element={<PersonalityAssessments />} />
          <Route path="/personality/:slug" element={<PersonalityAssessmentDetail />} />
          <Route path="/personality/:slug/chat" element={<PersonalityChat />} />
          <Route path="/personality/:slug/form" element={<PersonalityForm />} />
          <Route path="/personality/results" element={<PersonalityResultsPage />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />

          {/* ====== Private User Routes ====== */}
          <Route element={<UserPrivateRoute />}>
            <Route path="/dashboard" element={<Dashboard />} />
            {/* *** FIX APPLIED HERE: The route path is now correct *** */}
            <Route path="/assessment/chat/:id" element={<AssessmentChat />} />
            <Route path="/results" element={<Results />} />
            <Route path="/supplementary/:id" element={<SupplementaryQuestions />} />
          </Route>

          {/* ====== Private Admin Routes ====== */}
          <Route element={<AdminPrivateRoute />}>
            <Route element={<AdminLayout />}>
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:id" element={<AdminUserDetail />} />
              <Route path="/admin/questionnaires" element={<AdminQuestionnaires />} />
              <Route path="/admin/questionnaires/new" element={<NewQuestionnaire />} /> 
              <Route path="/admin/questionnaires/edit/:id" element={<EditQuestionnaire />} />
              <Route path="/admin/reports" element={<AdminReports />} />
              <Route path="/admin/reports/:id" element={<AdminReportDetail />} />
              <Route path="/admin/organizations" element={<AdminOrganizations />} />
              <Route path="/admin/blog" element={<AdminBlogs />} />
              <Route path="/admin/personality-tests" element={<AdminPersonalityAssessments />} />
              <Route path="/admin/personality-results" element={<AdminPersonalityResults />} />
            </Route>
          </Route>

          {/* ====== 404 Not Found ====== */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Router>
      <Toaster richColors position="bottom-right" />
    </AssessmentProvider>
  );
}

export default App;
