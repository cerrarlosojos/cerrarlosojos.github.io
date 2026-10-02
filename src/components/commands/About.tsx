import { AboutWrapper, HighlightSpan } from "../styles/About.styled";
import { profile } from "../../data/profile";
import { Link } from "../styles/Link.styled";

const About: React.FC = () => {
  return (
    <AboutWrapper data-testid="about">
      <p>
        Hello! I am{" "}
        <HighlightSpan>
          {profile.name} ({profile.chineseName})
        </HighlightSpan>
        .
      </p>
      <p>
        I am a <HighlightSpan>{profile.role}</HighlightSpan> at{" "}
        {profile.institution}'s {profile.department}, affiliated with the{" "}
        <Link href={profile.lab.url}>{profile.lab.name}</Link>.
      </p>
      <p>
        I am advised by Prof.{" "}
        <Link href={profile.advisor.url}>{profile.advisor.name}</Link>. My
        research interests lie in{" "}
        <HighlightSpan>{profile.research.field}</HighlightSpan>, with a current
        focus on <HighlightSpan>{profile.research.focus}</HighlightSpan>.
      </p>
    </AboutWrapper>
  );
};

export default About;
