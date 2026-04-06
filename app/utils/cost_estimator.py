COST_PER_1K_TOKENS_INPUT = 0.003
COST_PER_1K_TOKENS_OUTPUT = 0.015
ELEVENLABS_COST_PER_1K_CHARS = 0.30 / 1000
LEONARDO_COST_PER_IMAGE = 0.02
HEYGEN_COST_PER_MINUTE = 0.10
COST_ALERT_THRESHOLD_USD = 2.00


def estimate_openrouter_cost(input_tokens: int, output_tokens: int) -> float:
    return (
        input_tokens / 1000 * COST_PER_1K_TOKENS_INPUT
        + output_tokens / 1000 * COST_PER_1K_TOKENS_OUTPUT
    )


def estimate_elevenlabs_cost(script: str) -> float:
    return len(script) * ELEVENLABS_COST_PER_1K_CHARS


def estimate_leonardo_cost(num_images: int) -> float:
    return num_images * LEONARDO_COST_PER_IMAGE


def estimate_heygen_cost(duration_minutes: float) -> float:
    return duration_minutes * HEYGEN_COST_PER_MINUTE
