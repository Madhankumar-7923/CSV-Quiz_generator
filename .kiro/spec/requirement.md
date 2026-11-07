# Requirements Document

## Introduction

CSV Quiz Generator turns a spreadsheet of multiple-choice questions into a
playable quiz. A quiz author exports a CSV, a player drops it into the page, and
the app validates the sheet, runs the questions one at a time with four options
each, tracks what was picked, and reports a scored result at the end.

It is delivered as static HTML, CSS and JavaScript with no build step, no
dependencies and no server. The sheet is read in the browser and never leaves
the machine.

### The original brief

> Basically we have game kinda setup
>
> CSV Quiz Generator
>
> we will create a static UI kinda setup where we have to upload a csv sheet
> from there it will fetch the question and answer validate the sheet and play
> like a game 1st question 4 option answers will be tracked and finaly result
> will be shown this is the setup

Requirements 1-9 are decomposed from those sentences. Requirements 10-13 are
additions made while building; each is marked **[Added]** and none of them
changes the behaviour the brief asked for.

## Glossary

| Term | Meaning |
| --- | --- |
| **Author** | The person who writes the questions in a spreadsheet and exports the CSV. |
| **Player** | The person who loads a sheet and takes the quiz. |
| **Sheet** | The uploaded CSV file as a whole. |
| **Row** | One line of the sheet below the header. |
| **Question** | A validated row: question text, four options, and exactly one correct option. |
| **Option** | One of the four answer choices, labelled A to D in the interface. |
| **Run** | One pass through a question set, from the first question to the results screen. |
| **Skipped** | A question the Player reached the end of the run without answering. |

## Requirements

### Requirement 1: Static, offline, dependency-free delivery

**User Story:** As a player, I want to open one file and have the quiz work, so that I don't have to install tooling, run a server, or hand my questions to a third party.

#### Acceptance Criteria

1. WHEN the Player opens `index.html` from the local filesystem THEN the application SHALL load and become fully interactive.
2. THE application SHALL NOT require a build step, a package install, or a network connection.
3. WHEN the Player selects a CSV file THEN the application SHALL read it in the browser and SHALL NOT transmit its contents over the network.
4. THE first-party scripts SHALL NOT rely on ES modules or `fetch()`.
5. WHERE demonstration or template data is needed THE application SHALL embed it in a script rather than fetching it from disk.

### Requirement 2: Getting a sheet into the app

**User Story:** As a player, I want to drag my sheet in or browse for it.

#### Acceptance Criteria

1. WHEN the Player clicks the drop zone THEN the system SHALL open a file picker.
2. WHEN the Player focuses the drop zone and presses Enter or Space THEN the system SHALL open the file picker.
3. WHILE a file is dragged over the drop zone THE system SHALL show a visible drop affordance.
4. WHEN the Player drops a file on the drop zone THEN the system SHALL load that file.
5. WHEN a file is dropped outside the drop zone THEN the system SHALL prevent the browser from navigating away.
6. IF the chosen file's name does not end in `.csv`, `.txt` or `.tsv` THEN the system SHALL refuse it.
7. IF the chosen file is zero bytes THEN the system SHALL report that the file is empty.
8. IF the browser cannot read the file THEN the system SHALL report that rather than failing silently.
9. WHEN the Player picks the same file twice THEN the system SHALL reload it.

### Requirement 3: Parsing sheets that real tools produce

**User Story:** As an author, I want my sheet to load exactly as my spreadsheet exported it.

#### Acceptance Criteria

1. WHERE a field is wrapped in double quotes THE parser SHALL treat delimiters, line breaks and doubled quotes inside it as literal content.
2. THE parser SHALL accept CRLF, LF and lone CR line endings.
3. IF the file begins with a UTF-8 byte order mark THEN the parser SHALL strip it.
4. THE parser SHALL auto-detect comma, semicolon, tab and pipe delimiters.
5. WHEN a quoted field spans multiple lines THEN the parser SHALL attribute every later row to its true source line number.
6. THE parser SHALL skip entirely blank lines.
7. IF the file does not end in a newline THEN the parser SHALL still emit the final row.

### Requirement 4: Finding the columns

**User Story:** As an author, I want my own column headings understood.

#### Acceptance Criteria

1. THE system SHALL require six logical columns: the question, four options, and the answer.
2. WHEN matching headers THEN the system SHALL ignore case, spaces and punctuation.
3. THE system SHALL accept documented aliases for each logical column.
4. WHEN more than one header could satisfy the same logical column THEN the system SHALL claim each header at most once.
5. WHERE columns beyond the required six are present THE system SHALL ignore them.
6. IF a required column cannot be matched THEN the system SHALL name the missing logical columns.

### Requirement 5: Validating the sheet

**User Story:** As an author, I want to be told exactly which line of my sheet is wrong and why.

#### Acceptance Criteria

1. IF a row's question text is blank THEN the system SHALL reject that row.
2. IF any of a row's four options is blank THEN the system SHALL reject the row.
3. IF two or more of a row's options are identical THEN the system SHALL reject the row.
4. IF a row's answer is blank THEN the system SHALL reject the row.
5. IF a row's answer does not identify one of its four options THEN the system SHALL reject the row.
6. THE system SHALL report every rejected row with the 1-based source line number.
7. WHEN rejected rows are reported THEN the system SHALL cap the visible list.
8. WHEN at least one row is rejected AND at least one valid question remains THEN the system SHALL offer to play the valid questions.
9. IF no valid question rows remain THEN the system SHALL NOT start a quiz.
10. THE system SHALL skip entirely blank rows without reporting them as errors.

### Requirement 6: Interpreting the answer column

**User Story:** As an author, I want to mark the correct answer whichever way is natural to me.

#### Acceptance Criteria

1. WHEN the answer is `1` through `4` THEN the system SHALL resolve it to that option position.
2. WHEN the answer is `A` through `D` in any case THEN the system SHALL resolve it to that option position.
3. WHEN the answer matches an option's full text ignoring case THEN the system SHALL resolve it to that option.
4. WHEN the answer is decorated, as in `Option 3`, `(b)` or `c)` THEN the system SHALL strip the decoration and resolve the position.
5. IF an answer could read both as an option's exact text and as a position THEN the text match SHALL take precedence.

### Requirement 7: Playing one question at a time

**User Story:** As a player, I want to work through the questions one at a time.

#### Acceptance Criteria

1. WHEN a quiz starts THEN the system SHALL present the first question.
2. THE system SHALL present exactly four selectable options per question, labelled A through D.
3. THE system SHALL show the current position as "Question X of Y" with a progress indicator.
4. WHEN the Player selects an option THEN the system SHALL visibly mark it as chosen.
5. WHILE the Player is on the first question THE back control SHALL be disabled.
6. WHEN the Player is on the last question THEN the advance control SHALL read "Finish".
7. THE Player SHALL be able to move back to earlier questions and forward again.
8. WHEN the Player presses `1` through `4` THEN the system SHALL select the corresponding option.
9. WHEN the Player chooses to quit THEN the system SHALL require confirmation.

### Requirement 8: Tracking the answers

**User Story:** As a player, I want my picks remembered as I move around.

#### Acceptance Criteria

1. THE system SHALL record which option the Player chose for each question independently.
2. WHEN the Player returns to a previously answered question THEN the system SHALL restore that selection.
3. WHEN the Player changes an answer THEN the system SHALL replace the previous selection.
4. THE answer state SHALL survive navigation for the whole run.

### Requirement 9: Showing the final result

**User Story:** As a player, I want a score and a breakdown of what I got wrong.

#### Acceptance Criteria

1. WHEN the Player finishes THEN the system SHALL show the results screen.
2. THE results SHALL state the number correct, the total, and the percentage correct.
3. THE results SHALL break the run down into correct, wrong and skipped counts.
4. THE system SHALL treat unanswered questions as skipped rather than wrong.
5. IF any question is unanswered when the Player finishes THEN the system SHALL require confirmation.
6. THE results SHALL report the elapsed time for the run.
7. THE results SHALL include a per-question review.
8. THE Player SHALL be able to replay, load a different sheet, or download the results.

### Requirement 10: Optional game modes [Added]

**User Story:** As a player replaying a sheet, I want to vary the order and get feedback as I go.

Not in the brief. All three default to off.

#### Acceptance Criteria

1. THE system SHALL offer shuffling of question order, shuffling of options, and per-question instant feedback, each defaulting to off.
2. WHERE option shuffling is enabled THE system SHALL remap the correct answer so that scoring stays accurate.
3. WHERE instant feedback is enabled WHEN the Player selects an option THEN the system SHALL reveal the correct option.
4. WHERE instant feedback is enabled WHEN a question has been answered THEN the system SHALL lock that question.
5. WHERE instant feedback is disabled THE system SHALL NOT reveal whether any answer was correct until the results screen.

### Requirement 11: Treating sheet content as untrusted [Added]

**User Story:** As a player opening a sheet someone sent me, I want its contents displayed rather than executed.

Not in the brief.

#### Acceptance Criteria

1. THE system SHALL insert all CSV-derived text as text content and SHALL NOT assign it to `innerHTML`.
2. WHEN a cell contains markup THEN the system SHALL display that markup literally as characters.

### Requirement 12: Accessibility baseline [Added]

**User Story:** As a player who navigates by keyboard or uses a screen reader, I want to take the quiz unaided.

Not in the brief.

#### Acceptance Criteria

1. THE Player SHALL be able to reach and operate every interactive control by keyboard.
2. THE four options SHALL form a single labelled radio group.
3. THE page SHALL provide a skip link to the main content.
4. WHEN the question changes or feedback appears THEN the system SHALL announce it through a live region.
5. THE system SHALL honour `prefers-reduced-motion` by suppressing transitions.
6. THE system SHALL remain legible under forced-colors mode.
7. Text and its background SHALL meet WCAG AA contrast.

### Requirement 13: Helping the author produce a valid sheet [Added]

**User Story:** As an author, I want to see the app work and get a correct starting file.

Not in the brief.

#### Acceptance Criteria

1. THE system SHALL offer a playable sample quiz that needs no file.
2. THE system SHALL offer a downloadable CSV template.
3. THE system SHALL document the expected format in the page.
4. WHEN the Player exports results THEN the file SHALL name each question, the chosen answer, the correct answer, and the overall score.

## Traceability

| Brief phrase | Requirement |
| --- | --- |
| "static UI kinda setup" | 1 |
| "upload a csv sheet" | 2 |
| "fetch the question and answer" | 3, 4, 6 |
| "validate the sheet" | 5 |
| "play like a game 1st question" | 7 |
| "4 option" | 7.2 |
| "answers will be tracked" | 8 |
| "finaly result will be shown" | 9 |
| (added, not in the brief) | 10, 11, 12, 13 |

## Out of scope

- Accounts, saved history, or persistence across page loads.
- A timer or per-question countdown.
- Question types other than single-answer multiple choice with four options.
- Authoring or editing questions in the UI.
- Scoring weights, partial credit, or negative marking.
- Multiple players, sharing, or any kind of leaderboard.