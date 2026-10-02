# Houjin Chen — Terminal Portfolio

A terminal-style academic homepage for **Houjin Chen (陈厚锦)**, a Ph.D. student at Peking University's School of Computer Science, affiliated with the Programming Languages Lab (PLL) and advised by Prof. Di Wang.

Personal information comes from [my academic website](https://cerrarlosojos.github.io/) and [its source repository](https://github.com/cerrarlosojos/cerrarlosojos.github.io).

## Personal information

The existing template commands contain the profile:

| Command | Content |
| --- | --- |
| `welcome` | Name banner, affiliation, research interests, lambda cube, and tennis silhouette |
| `about` | Biography, lab, and advisor |
| `education` | Ph.D. studies and bachelor's degree at Peking University |
| `projects` | C★ preprint with its description, PDF, and BibTeX links |
| `socials` | Bulleted GitHub and email links, plus publications with PDF and BibTeX links |
| `pwd` | Displays the absolute virtual path |
| `cd [directory]` | Changes the virtual directory; `cd` and `cd ~` return home, `cd ..` goes up one level |
| `ls [-a] [directory]` | Lists Publications and Blog; `-a` also reveals `.Games/` |
| `cat <file> [file ...]` | Displays file source and shows clickable sources for linked files |
| `glow <file.md> [file ...]` | Previews Markdown articles in the terminal |

Themes, autocomplete, keyboard shortcuts (including ↑ / ↓ to recall commands), and offline support remain available. Type `help` to see the grouped command list.

## Updating the profile

Edit `src/data/profile.ts` for the biography, education, public links, and publications. `projects`, `socials`, and the Publications directory share the same publication data. `projects` and `socials` display their content directly; the email address uses a `mailto:` link.

Edit `src/data/filesystem.ts` for the virtual folders and listing summaries. Publications contains only `cstar.pdf`: the filename on the left links directly to the arXiv PDF, and the paper title appears on the right. Blog lists `first-blog.md`, with a one-sentence summary on the right. Its hidden `.dejavu.txt` appears with `ls -a Blog`; hidden file completion requires a leading dot.

Edit `src/data/blog/first-blog.md` for the blog itself. It preserves the title, date, and tag from [_posts/2025-11-30-first-blog.md](https://github.com/cerrarlosojos/cerrarlosojos.github.io/blob/main/_posts/2025-11-30-first-blog.md), with a local “Hello World!” paragraph added. `glow Blog/first-blog.md` displays a Markdown preview in the terminal, or use `cd Blog` followed by `glow first-blog.md`. YAML front matter supplies the article title, date, and tags; the body supports headings, lists, links, code blocks, and GitHub-style tables. `cat Blog/first-blog.md` displays the original source instead. The website implements these commands directly; no external reader or editor is required. `cat Publications/cstar.pdf` shows the paper description and clickable PDF source.

`cd ~` or `cd` returns home; `cd ..` goes up one directory. The virtual hierarchy includes `/`, `/home`, and `/home/cerrarlosojos` (`~`), so `cd ..` at home enters `/home`; only `/` stays in place when going up. `ls` and Tab completion show the actual children at each level. `ls ~` lists home from any folder. Relative and home paths such as `../Publications/`, `~/Blog/`, and `/home/cerrarlosojos/Blog/` work. Failed changes keep the current directory, and clearing the terminal preserves it. Earlier prompts and outputs keep the directory where each command was run. These are virtual folders, separate from the computer's actual files.

The ASCII name banner and lambda cube are in `src/components/commands/Welcome.tsx`. The tennis letter silhouette is in `src/data/tennisAscii.ts`. Static page metadata is in `index.html` and `public/site.webmanifest`.

Command names, help visibility, argument support and completion modes share
`src/data/commands.ts`. `src/utils/command.ts` parses input and returns completion
candidates. `Terminal` executes state changes on submission; output components
only render the recorded command and its original working directory. The virtual
filesystem uses directory/file entries in one tree, so adding a nested folder
does not require new path-handling branches.

Source fields were read from `_config.yml`, `_pages/about.md`, `_pages/cv.md`, `_publications`, and `_posts` at revision `058ac6b3325bb0009911e840f44586d021b0ca2d` of the academic website repository. The sample JSON CV was excluded. The biography uses “Ph.D. student” without a year-specific label.

## Hidden dinosaur game

`ls` keeps the home listing focused on Publications and Blog. `ls -a` reveals
`.Games/`; `ls .Games` lists its `dino` executable. Use `cd .Games`, then `./dino`,
or launch it directly from home with `./.Games/dino`. Tab completes hidden folders
when the path starts with a dot, and also completes executable paths.

The game runs inside the existing result box. Space or ↑ jumps, ↓ ducks, Enter
restarts after a crash, and tapping jumps on touch devices. Esc or the Exit button
removes the game box and its controls, closes the session and restores terminal
input. Re-running the command starts a new session. The best score is stored
in this browser when local storage is available. The engine initializes only when launched.

The engine and assets come from [devfolioco/t-rex-runner-game](https://github.com/devfolioco/t-rex-runner-game),
with local changes for scoped input, theme colors, responsive sizing and complete
cleanup. The pinned revision and modifications are documented in
`src/vendor/dino/README.md`. Its BSD 3-Clause license is preserved in the vendor
folder and shipped at `public/licenses/dino-BSD-3-Clause.txt`.

## Hidden memory

`cat Blog/.dejavu.txt` opens an encrypted memory. The most recent completed
dino run must score **above 500**. Its last four score digits are the password,
padded with zeros (501 → `0501`). A later completed run replaces the key; a run
at or below 500 locks the file again. Exiting an unfinished game does not change
the previous completed score.

The browser seals the destination with AES-GCM and a PBKDF2-derived key, using
a fresh salt and nonce for every qualifying run. Only ciphertext is stored for
this file. This is a local puzzle, not access control for a private website.
After unlocking, the floating, rotating black cube appears directly. Clicking
it opens the destination in a new tab. Reduced-motion preferences stop the
cube's rotation and levitation.
The file always offers the same cryptic password prompt, without disclosing
the score requirement or password format. Keyboard focus subtly highlights
the cube's own edges instead of drawing a rectangular frame around the link.

Change `destination` in `src/games/dinoMemory.ts` to update the cube's link
(currently `https://www.bilibili.com/video/BV1PK4y1B76J/`). This affects newly generated keys.

## Running locally

```bash
pnpm install --frozen-lockfile
pnpm dev
```

## Checks

```bash
pnpm build
pnpm test:once
pnpm lint
```

## Template credit

Based on [Sat Naing's Terminal Portfolio](https://github.com/satnaing/terminal-portfolio), built with React, TypeScript, Styled Components, and Vite. The original MIT license and copyright notice are preserved in `LICENSE`.
