"""
Title: I'm Proud of You
Date: 2026-10-28
Type: code
Tags: python, gui, interactive, heart
Description: An interactive Tkinter popup displaying a pulsing animated vector heart with an
  encouraging message inside.
"""

import math
import tkinter as tk


WINDOW_WIDTH = 420
WINDOW_HEIGHT = 420
BACKGROUND = "#1e1e2e"
HEART_COLOR = "#f38ba8"
BUTTON_COLOR = "#313244"
BUTTON_HOVER_COLOR = "#45475a"


def center_window(root: tk.Tk) -> None:
    root.update_idletasks()
    x = (root.winfo_screenwidth() - WINDOW_WIDTH) // 2
    y = (root.winfo_screenheight() - WINDOW_HEIGHT) // 2
    root.geometry(f"{WINDOW_WIDTH}x{WINDOW_HEIGHT}+{x}+{y}")


def rounded_rectangle(
    canvas: tk.Canvas,
    x1: float,
    y1: float,
    x2: float,
    y2: float,
    radius: float,
    fill: str,
    tags: tuple[str, ...] = (),
) -> int:
    points = [
        x1 + radius, y1,
        x2 - radius, y1,
        x2, y1,
        x2, y1 + radius,
        x2, y2 - radius,
        x2, y2,
        x2 - radius, y2,
        x1 + radius, y2,
        x1, y2,
        x1, y2 - radius,
        x1, y1 + radius,
        x1, y1,
    ]
    return canvas.create_polygon(
        points,
        smooth=True,
        fill=fill,
        tags=tags,
    )


def main() -> None:
    root = tk.Tk()
    root.title("A Little Reminder")
    root.resizable(False, False)
    root.configure(background=BACKGROUND)
    center_window(root)

    canvas = tk.Canvas(
        root,
        width=WINDOW_WIDTH,
        height=WINDOW_HEIGHT,
        background=BACKGROUND,
        borderwidth=0,
        highlightthickness=0,
    )
    canvas.pack(fill="both", expand=True)

    def close_window(_event: tk.Event | None = None) -> None:
        root.destroy()

    canvas.bind("<Button-1>", close_window)
    root.bind("<Escape>", close_window)
    root.protocol("WM_DELETE_WINDOW", close_window)

    heart: int | None = None
    message = canvas.create_text(
        WINDOW_WIDTH / 2,
        WINDOW_HEIGHT * 0.43,
        text="I'm proud of you",
        fill="#ffffff",
        font=("Helvetica", 15, "bold"),
    )

    button_x1, button_y1 = 160, 350
    button_x2, button_y2 = 260, 390
    button_tag = "close_button"
    button_background_tag = "close_button_background"
    rounded_rectangle(
        canvas,
        button_x1,
        button_y1,
        button_x2,
        button_y2,
        12,
        fill=BUTTON_COLOR,
        tags=(button_tag, button_background_tag),
    )
    button_text = canvas.create_text(
        (button_x1 + button_x2) / 2,
        (button_y1 + button_y2) / 2,
        text="Close",
        fill="#cdd6f4",
        font=("Helvetica", 11, "bold"),
        tags=(button_tag,),
    )

    def set_button_hover(_event: tk.Event, color: str) -> None:
        canvas.itemconfigure(button_background_tag, fill=color)

    canvas.tag_bind(
        button_tag,
        "<Enter>",
        lambda event: set_button_hover(event, BUTTON_HOVER_COLOR),
    )
    canvas.tag_bind(
        button_tag,
        "<Leave>",
        lambda event: set_button_hover(event, BUTTON_COLOR),
    )
    canvas.tag_bind(button_tag, "<Button-1>", close_window)
    canvas.tag_raise(message)
    canvas.tag_raise(button_text)

    phase = 0.0
    sample_count = 120

    def update_heart() -> None:
        nonlocal heart, phase
        width = canvas.winfo_width()
        height = canvas.winfo_height()
        center_x = width / 2
        center_y = height * 0.43
        base_scale = min(width * 0.68 / 32, height * 0.64 / 29)
        pulse_scale = base_scale * (1 + 0.08 * math.sin(phase))
        coordinates = []
        top = float("inf")
        bottom = float("-inf")

        for index in range(sample_count):
            angle = 2 * math.pi * index / sample_count
            x = 16 * math.sin(angle) ** 3
            y = -(
                13 * math.cos(angle)
                - 5 * math.cos(2 * angle)
                - 2 * math.cos(3 * angle)
                - math.cos(4 * angle)
            )
            coordinates.extend(
                (center_x + x * pulse_scale, center_y + y * pulse_scale)
            )
            point_y = center_y + y * pulse_scale
            top = min(top, point_y)
            bottom = max(bottom, point_y)

        if heart is None:
            heart = canvas.create_polygon(
                *coordinates,
                fill=HEART_COLOR,
                outline="",
                smooth=True,
            )
            canvas.tag_lower(heart)
        else:
            canvas.coords(heart, *coordinates)
        canvas.coords(message, center_x, top + (bottom - top) * 0.43)
        phase += 0.08
        root.after(30, update_heart)

    update_heart()
    root.mainloop()


if __name__ == "__main__":
    main()
