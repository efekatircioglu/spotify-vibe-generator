import AuthWrapper from "../../components/AuthWrapper";

export default function Last6MonthsLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
