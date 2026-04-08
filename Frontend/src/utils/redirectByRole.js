export function redirectByRole(role, navigate) {
  if (role === 'admin') return navigate('/dashboard/admin');
  if (role === 'professor') return navigate('/dashboard/professor');
  return navigate('/dashboard/student');
}
