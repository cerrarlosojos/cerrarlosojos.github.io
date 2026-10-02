import { Link } from "./styles/Link.styled";

const PublicationLinks = ({ pdf, bibtex }: { pdf: string; bibtex: string }) => (
  <>
    <Link href={pdf}>PDF</Link> · <Link href={bibtex}>BibTeX</Link>
  </>
);

export default PublicationLinks;
