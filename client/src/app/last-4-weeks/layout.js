import AuthWrapper from "../../components/AuthWrapper";

export default function Last4WeeksLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
