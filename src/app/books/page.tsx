import BooksClient from './BooksClient';
import { ProtectedRoute } from '@/components/auth/protected-route';

export default function BooksPage() {
  return (
    <ProtectedRoute children={<BooksClient />} />
  );
}
