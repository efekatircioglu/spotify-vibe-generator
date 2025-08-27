import AuthWrapper from "../../components/AuthWrapper";

export default function ConcertsLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
