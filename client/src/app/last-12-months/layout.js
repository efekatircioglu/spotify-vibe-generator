import AuthWrapper from "../../components/AuthWrapper";

export default function Last12MonthsLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
