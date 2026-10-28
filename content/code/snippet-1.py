"""A tiny reminder to leave things a little better than you found them."""


def keep_a_note(thought: str, notes: list[str]) -> list[str]:
    """Return a new collection with a trimmed, non-empty thought appended."""
    thought = thought.strip()
    if not thought:
        return notes.copy()
    return [*notes, thought]
