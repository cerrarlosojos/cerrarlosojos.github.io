import { EduIntro, EduList } from "../styles/Education.styled";
import { Link } from "../styles/Link.styled";
import { Wrapper } from "../styles/Output.styled";

const Teaching: React.FC = () => (
  <Wrapper data-testid="teaching">
    <EduIntro>Teaching Experience</EduIntro>
    <EduList>
      <div className="title">
        <Link href="https://stonebuddha.github.io/compiler26spring/">
          Compiler Principles Honor Track (Spring 2026)
        </Link>
      </div>
      <div className="desc">Teaching Assistant</div>
    </EduList>
  </Wrapper>
);

export default Teaching;
