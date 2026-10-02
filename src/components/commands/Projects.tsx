import {
  ProjectContainer,
  ProjectDesc,
  ProjectsIntro,
  ProjectTitle,
} from "../styles/Projects.styled";
import { publications } from "../../data/profile";
import PublicationLinks from "../PublicationLinks";

const Projects: React.FC = () => (
  <div data-testid="projects">
    <ProjectsIntro>Research work.</ProjectsIntro>
    {publications.map(({ title, desc, pdf, bibtex }, index) => (
      <ProjectContainer key={title}>
        <ProjectTitle>{`${index + 1}. ${title}`}</ProjectTitle>
        <ProjectDesc>{desc}</ProjectDesc>
        <ProjectDesc>
          <PublicationLinks pdf={pdf} bibtex={bibtex} />
        </ProjectDesc>
      </ProjectContainer>
    ))}
  </div>
);

export default Projects;
