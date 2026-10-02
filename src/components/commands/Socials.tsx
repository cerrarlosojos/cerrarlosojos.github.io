import { publications, socials } from "../../data/profile";
import {
  PublicationList,
  SocialList,
  SocialTitle,
} from "../styles/Socials.styled";
import { Link } from "../styles/Link.styled";
import PublicationLinks from "../PublicationLinks";

const Socials: React.FC = () => (
  <SocialList data-testid="socials">
    {socials.map(({ title, url, label }) => (
      <li key={title}>
        <SocialTitle>{title}</SocialTitle>
        <Link href={url}>{label}</Link>
      </li>
    ))}
    <li>
      <SocialTitle>Publications</SocialTitle>
      <PublicationList>
        {publications.map(({ title, pdf, bibtex }) => (
          <article key={title}>
            <div>{title}</div>
            <div>
              <PublicationLinks pdf={pdf} bibtex={bibtex} />
            </div>
          </article>
        ))}
      </PublicationList>
    </li>
  </SocialList>
);

export default Socials;
