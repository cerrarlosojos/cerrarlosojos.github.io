import { EduIntro, EduList } from "../styles/Education.styled";
import { Wrapper } from "../styles/Output.styled";
import { education } from "../../data/profile";

const Education: React.FC = () => {
  return (
    <Wrapper data-testid="education">
      <EduIntro>Education</EduIntro>
      {education.map(({ title, desc }) => (
        <EduList key={title}>
          <div className="title">{title}</div>
          <div className="desc">{desc}</div>
        </EduList>
      ))}
    </Wrapper>
  );
};

export default Education;
