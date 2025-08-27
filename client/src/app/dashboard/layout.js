import AuthWrapper from "../../components/AuthWrapper";

export default function DashboardLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
