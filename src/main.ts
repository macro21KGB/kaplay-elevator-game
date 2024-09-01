import kaplay, { Comp, Vec2 } from "kaplay"
import { onUpdate } from "kaplay/dist/declaration/game"

const k = kaplay({
    global: false,
    background: [172, 50, 50],
    backgroundAudio: true,
})



const { scene, go, text, pos, center, anchor,
    onKeyPress, area, body, rect,
    add, outline, offscreen, width, height,
    Color, move, get, mousePos,
    LEFT, onButtonDown, onButtonPress, color, loadSprite, loadMusic, play, loadSound } = k


loadSprite("timer", "assets/timer.png")
loadSprite("background", "assets/background.png")
loadMusic("bgm", "assets/music.mp3")

loadSound("success", "assets/success.wav")
loadSound("error", "assets/error.wav")

k.volume(0.8)

const BUTTON_NUMBERS = [10, 11, 12, 7, 8, 9, 4, 5, 6, 1, 2, 3, 0]

class MathQuestionGenerator {
    operators = ["+", "-", "*"] as const
    lastResult = -1

    generateQuestion() {

        let valid = false

        while (!valid) {
            const operator = this.operators[Math.floor(Math.random() * this.operators.length)]
            let a = Math.floor(Math.random() * 20 + 1)
            let b = Math.floor(Math.random() * 20 + 1)

            const possibleEquation = `${a} ${operator} ${b}`
            const questionSolution = this.evaluateQuestion(possibleEquation)

            if (questionSolution >= 0 && questionSolution <= 11)
                valid = true

            if (valid) {
                this.lastResult = questionSolution
                return possibleEquation;
            }

        }
        return "0 + 0"

    }

    evaluateQuestion(question: string) {
        const firstPart = question.split(" ")[0]
        const operator = question.split(" ")[1]
        const secondPart = question.split(" ")[2]

        switch (operator) {
            case "+":
                return parseInt(firstPart) + parseInt(secondPart)
            case "-":
                return parseInt(firstPart) - parseInt(secondPart)
            case "*":
                return parseInt(firstPart) * parseInt(secondPart)
            default:
                return 0
        }
    }

}



scene("main", () => {
    add([
        text("What's the floor?", {
            size: 48
        }),
        pos(center()),
        anchor("center"),
    ]);

    add([
        text("Press Space to start"),
        pos(width() / 2, height() / 2 + 100),
        anchor("center"),
    ]);

    add([
        text("Use the buttons to answer the math questions"),
        pos(width() / 2, height() / 2 + 150),
        anchor("center"),
    ])

    add([
        text("Made with Kaplay"),
        pos(width() / 2, height() - 50),
        anchor("center"),
        color(Color.fromHex("#aeaeae"))
    ])

    onKeyPress("space", () => {
        go("game");
    })
})

export interface ScoreComp extends Comp {
    increment: (value: number) => void,
    decrement: (value: number) => void,
    set: (value: number) => void,
    get: () => number,
    reset: () => void,
}


scene("game", () => {


    // Looping background music
    const bgm_music = play("bgm", {
        loop: true,
        speed: 0.8,
    })

    bgm_music.onEnd(() => {
        bgm_music.play()
    })

    const ELEVATOR_PANEL_WIDTH = 400
    let current_floor = 0

    const mathGenerator = new MathQuestionGenerator()

    const scoreContainer = add([
        rect(350, 50, {
            radius: 10,
        }),
        pos(10, 10),
        area(),
        color(Color.fromHex("#ffffff"))
    ])

    const score = scoreContainer.add([
        text("Score: 0"),
        pos(10, 10),
        color(Color.BLACK),
        k.timer(),
        "score",
        {
            value: 0
        }
    ])

    const gameTime = scoreContainer.add([
        k.sprite("timer"),
        color(Color.BLACK),
        pos(score.pos.add(k.vec2(200, 0))),
        area(),
    ])


    const scoreText = gameTime.add(
        [
            text("60"),
            color(Color.BLACK),
            k.timer(),
            "score-text",
            pos(50, 0),
            {
                time: 60
            }
        ]
    )

    scoreText.loop(1, () => {
        scoreText.time -= 1
        scoreText.text = `${scoreText.time}`
    })


    scoreText.onUpdate(() => {
        if (scoreText.time <= 0) {
            go("game-over", score.value)
        }
    })

    add([
        k.sprite("background", {
            height: height(),
        }),
        k.z(-10)
    ])


    const elevatorPanel = add([
        rect(ELEVATOR_PANEL_WIDTH, height()),
        pos(width() - ELEVATOR_PANEL_WIDTH, 0),
        area(),
        color(Color.fromHex("#aeaeae"))
    ])

    add([
        rect(ELEVATOR_PANEL_WIDTH, 100),
        pos(width() - ELEVATOR_PANEL_WIDTH, 0),
        outline(5, Color.fromHex("#447744")),
    ])

    const elevatorDisplay = add([
        text("0",),
        pos(elevatorPanel.pos.add(k.vec2(ELEVATOR_PANEL_WIDTH / 2, 50))),
        anchor("center"),
        color(Color.fromHex("#000000")),
        {
            value: 0
        }
    ])


    const createElevatorButton = (floor: number, cPos: Vec2, onClickFunction: (floor: number) => void) => {
        const button = add([
            k.circle(25),
            pos(cPos),
            outline(3, Color.BLACK),
            area(),
            color(Color.fromHex("#ffffff")),
            anchor("center"),
            {
                floor: floor
            }
        ])

        button.add(
            [
                text(`${floor}`),
                anchor("center"),
                color(Color.BLACK),
                k.z(10)
            ]
        )

        button.onHoverUpdate(() => {
            button.outline.width = 5
            button.color = Color.fromHex("#dedede")

        })

        button.onHoverEnd(() => {
            button.color = Color.fromHex("#ffffff")
            button.outline.width = 3
        })

        button.onClick(() => {
            onClickFunction(floor)
        })

    }

    const generateQuestionBubble = () => {
        const question = mathGenerator.generateQuestion()
        const answer = mathGenerator.evaluateQuestion(question)

        const bubble = add([
            k.circle(100),
            pos(k.vec2(250, height() / 2)),
            area(),
            color(Color.fromHex("#ffffff")),
            anchor("center"),
            "bubble",
            {
                question: question,
                answer: answer
            }
        ])


        const bubbleText = bubble.add([
            text(question),
            anchor("center"),
            color(Color.BLACK),
            "bubble-text",
            k.z(10)
        ])

        bubbleText.onUpdate(() => {
            bubbleText.text = bubble.question
        })

        return bubble
    }

    generateQuestionBubble()


    const createButtons = () => {

        const OFFSET_FROM_TOP = 150

        BUTTON_NUMBERS.forEach((value, i) => {

            // grid of buttons (3 cols)
            const col = i % 3
            const row = Math.floor(i / 3)

            const x = width() - ELEVATOR_PANEL_WIDTH + 100 + col * 100
            const y = OFFSET_FROM_TOP + row * 100

            createElevatorButton(value, k.vec2(x, y), (floor) => {
                current_floor = floor
                elevatorDisplay.text = `${current_floor}`

                // check if bubble is correct
                const bubble = get("bubble")[0]
                const bubbleText = bubble.c("bubble-text")
                if (bubble.answer === current_floor) {
                    play("success")
                    score.value += 1
                    score.text = `Score: ${score.value}`
                } else {
                    play("error")
                    score.color = Color.RED
                    score.value -= 1
                    score.text = `Score: ${score.value}`
                    score.wait(0.5, () => {
                        score.color = Color.BLACK
                    })
                }
                bubble.question = mathGenerator.generateQuestion()
                bubble.answer = mathGenerator.evaluateQuestion(bubble.question)

            })
        })
    }

    createButtons()
})

scene("game-over", (score) => {

    add([
        text("Game Over", {
            size: 48
        }),
        pos(center()),
        anchor("center"),
    ]);

    add([
        text("Score: " + score),
        pos(width() / 2, height() / 2 + 50),
        anchor("center"),
    ])

    add([
        text("Press Space to restart"),
        pos(width() / 2, height() / 2 + 100),
        anchor("center"),
    ]);

    onKeyPress("space", () => {
        go("game");
    })
})

go("main")