import { Fragment } from "react";
import {
  CommandDescription,
  CommandGrid,
  CommandName,
  HelpPanel,
  HelpSection,
  PanelTitle,
  SectionTitle,
} from "../styles/Help.styled";
import { commandGroups, commands } from "../../data/commands";

const Help: React.FC = () => {
  return (
    <HelpPanel data-testid="help">
      <PanelTitle>Commands</PanelTitle>
      {commandGroups.map(group => {
        const groupCommands = commands.filter(
          command =>
            command.group === group && !("hidden" in command && command.hidden)
        );

        if (groupCommands.length === 0) return null;

        return (
          <HelpSection key={group}>
            <SectionTitle>{group}</SectionTitle>
            <CommandGrid>
              {groupCommands.map(({ cmd, desc }) => (
                <Fragment key={cmd}>
                  <CommandName>{cmd}</CommandName>
                  <CommandDescription>{desc}</CommandDescription>
                </Fragment>
              ))}
            </CommandGrid>
          </HelpSection>
        );
      })}
    </HelpPanel>
  );
};

export default Help;
