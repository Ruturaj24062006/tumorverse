from typing import Any, Dict


class BaseAgent:
    """Abstract agent interface for cognition agents.

    Agents should implement `analyze(context)` and return a serializable dict
    with structured outputs and confidence scores.
    """

    name: str = "base"
    description: str = "Base cognition agent"

    def __init__(self, config: Dict[str, Any] | None = None):
        self.config = config or {}

    def analyze(self, context: Dict[str, Any]) -> Dict[str, Any]:
        """Perform analysis and return JSON-serializable result.

        Args:
            context: dict containing input data (mesh, mask, metadata)

        Returns:
            dict: structured analysis output
        """
        raise NotImplementedError("Agents must implement analyze()")
