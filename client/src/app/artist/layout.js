import AuthWrapper from "../../components/AuthWrapper";

export default function ArtistLayout({ children }) {
  return (
    <AuthWrapper>
      {children}
    </AuthWrapper>
  );
}
