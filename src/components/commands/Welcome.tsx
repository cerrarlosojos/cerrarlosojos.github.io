import {
  Cmd,
  HeroContainer,
  PreImg,
  PreName,
  Seperator,
  TennisPortrait,
} from "../styles/Welcome.styled";
import { profile } from "../../data/profile";
import { tennisAscii } from "../../data/tennisAscii";

const nameBanner = `
  +---------------------------+
  |     CERRAR LOS OJOS.      |
  +---------------------------+
`;

// Aspinall & Hofmann, ATTAPL, Chapter 2, Section 2.7, p. 71.
// https://homepages.inf.ed.ac.uk/da/papers/attapl/
const lambdaCube = `    Fω-------------CC
    /|             /|
   / |            / |
  /  |           /  |
 F--------------·   |
 |   |          |   |
 |   ·--------- | --·
 |  /           |  /
 | /            | /
 |/             |/
λ→-------------λP`;

const Welcome: React.FC = () => {
  return (
    <HeroContainer data-testid="welcome">
      <div className="info-section">
        <PreName>{nameBanner}</PreName>
        <div>
          Welcome to {profile.name} ({profile.chineseName})'s homepage.
        </div>
        <Seperator>----</Seperator>
        <div>
          {profile.role} · {profile.institution}
        </div>
        <div>
          Research: {profile.research.field} · {profile.research.focus}
        </div>
        <PreImg
          role="img"
          aria-label="Lambda cube from ATTAPL, Chapter 2: Dependent Types"
        >
          {lambdaCube}
        </PreImg>
        <Seperator>----</Seperator>
        <div>
          For a list of available commands, type `<Cmd>help</Cmd>`.
        </div>
      </div>
      <div className="illu-section">
        <TennisPortrait
          role="img"
          aria-label="Letter silhouette of a tennis serve, with a player, racket, and tossed ball"
        >
          {tennisAscii}
        </TennisPortrait>
      </div>
    </HeroContainer>
  );
};

export default Welcome;
