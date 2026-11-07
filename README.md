# CSV Quiz Generator

Turn a spreadsheet of multiple-choice questions into a quiz you can play in your
browser. Your file never leaves your computer.

## Start the game

Open `index.html` in your browser by double-clicking it. There is nothing to
install and no sign-in.

## How to play

**1. Load your questions.**
Drag a CSV file onto the upload box, or click the box to browse for one. In a
hurry? Click **Try a sample quiz** to play ten ready-made questions.

**2. Pick your options (before loading the file).**

| Option | What it does |
| ------ | ------------ |
| Shuffle question order | Questions come up in a random order. |
| Shuffle answer options | A, B, C and D are rearranged on every question. |
| Show if each answer was right as I go | Tells you immediately whether you got it right. That question then locks and can't be changed. |

Leave all three off and you get a plain run: fixed order, no hints until the end,
and you can change your mind on any question.

**3. Answer the questions.**
One question at a time, four options each. Click an option, or press
<kbd>1</kbd>, <kbd>2</kbd>, <kbd>3</kbd> or <kbd>4</kbd>.

**4. Move around.**

- **Next** or <kbd>Enter</kbd> goes forward.
- **Back** or <kbd>←</kbd> goes to the previous question.
- Going back and changing an answer is allowed, unless you turned on instant feedback.
- **Quit** abandons the run. It asks first, because your answers are lost.

**5. Finish.**
On the last question the button says **Finish**. If you left anything blank, you
get a warning first. Skipped questions score zero, so it's worth going back for them.

**6. See how you did.**
The result screen gives you a percentage, a correct / wrong / skipped count, and
how long you took. Below that is a question-by-question review showing the right
answer next to what you picked. Tick **Only show what I got wrong** to go
straight to your mistakes.

From there you can:

- **Play again** – same questions, fresh score.
- **Load a different CSV** – back to the upload screen.
- **Download results** – saves your answers and score as a CSV file.

## Keyboard shortcuts

| Key | Action |
| --- | ------ |
| <kbd>1</kbd> – <kbd>4</kbd> | Choose answer A, B, C or D |
| <kbd>Enter</kbd> | Next question, or finish |
| <kbd>←</kbd> | Previous question |

## Making your own question sheet

Click **Download CSV template** on the upload screen for a file you can fill in.

```csv
question,option1,option2,option3,option4,answer
"What is 2 + 2?",3,4,5,6,2
"Capital of Japan?",Osaka,Kyoto,Tokyo,Nagoya,Tokyo
```

### Three ways to write the answer

- the option number: `1` to `4`
- the option letter: `A` to `D`
- the full text of the correct option, e.g. `Tokyo`

## If your file won't load

The app checks the sheet before starting and tells you which line of your file
is at fault. If only a few rows are broken, you'll be offered the chance to
**play the good questions anyway**.