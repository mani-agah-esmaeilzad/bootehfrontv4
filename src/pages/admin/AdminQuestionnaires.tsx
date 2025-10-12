// src/pages/admin/AdminQuestionnaires.tsx

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { LoaderCircle, PlusCircle, Trash, Edit } from "lucide-react";
import { toast } from "sonner";
import apiFetch from "@/services/apiService";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { QuestionnaireCategory } from "@/constants/questionnaireCategories";

interface Questionnaire {
  id: number;
  title: string; // The backend sends 'title' now
  description: string;
  display_order: number;
  category: QuestionnaireCategory;
}

const AdminQuestionnaires = () => {
  const [questionnaires, setQuestionnaires] = useState<Questionnaire[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<number | null>(null); // State to hold the ID of the questionnaire to be deleted
  const navigate = useNavigate();

  const fetchQuestionnaires = async () => {
    setIsLoading(true);
    try {
      const response = await apiFetch("admin/questionnaires");
      if (response.success) {
        setQuestionnaires(response.data);
      }
    } catch (error: any) {
      toast.error(error.message || "خطا در دریافت لیست پرسشنامه‌ها");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestionnaires();
  }, []);

  const handleDelete = async () => {
    if (deleteId === null) return;
    try {
      await apiFetch(`admin/questionnaires/${deleteId}`, { method: 'DELETE' });
      toast.success("پرسشنامه با موفقیت حذف شد.");
      setQuestionnaires(prev => prev.filter(q => q.id !== deleteId));
    } catch (error: any) {
      toast.error(error.message || "خطا در حذف پرسشنامه");
    } finally {
      setDeleteId(null); // Close the dialog
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مدیریت پرسشنامه‌ها</h1>
        <Button onClick={() => navigate('/admin/questionnaires/new')}>
          <PlusCircle className="h-4 w-4 ml-2" />
          ایجاد پرسشنامه جدید
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>لیست پرسشنامه‌ها</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <LoaderCircle className="animate-spin h-8 w-8 text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>عنوان پرسشنامه</TableHead>
                  <TableHead>توضیحات</TableHead>
                  <TableHead>دسته‌بندی</TableHead>
                  <TableHead className="w-[120px]">عملیات</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {questionnaires.map((q) => (
                  <TableRow key={q.id}>
                    {/* *** FINAL FIX APPLIED HERE: Using 'q.title' instead of 'q.name' *** */}
                    <TableCell className="font-medium">{q.title}</TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-sm truncate">{q.description}</TableCell>
                    <TableCell>{q.category}</TableCell>
                    <TableCell className="text-left">
                      <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={() => navigate(`/admin/questionnaires/edit/${q.id}`)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="destructive" size="icon" onClick={() => setDeleteId(q.id)}>
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteId !== null} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>آیا از حذف این پرسشنامه اطمینان دارید؟</AlertDialogTitle>
            <AlertDialogDescription>
              این عمل غیرقابل بازگشت است. تمام گزارش‌های مرتبط با این پرسشنامه نیز ممکن است تحت تاثیر قرار گیرند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminQuestionnaires;
