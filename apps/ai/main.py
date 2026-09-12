from datetime import datetime, timezone
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field

app = FastAPI(
    title="GridTrade AI Service",
    version="0.1.0",
    description="Explicit boundary for future forecasting and recommendation models.",
)


class PredictionRequest(BaseModel):
    prediction_type: Literal["generation", "demand", "price", "anomaly"]
    horizon: Literal["1h", "6h", "24h", "7d"] = "24h"
    signals: dict[str, float] = Field(default_factory=dict)


class PredictionResponse(BaseModel):
    prediction_type: str
    horizon: str
    status: Literal["boundary_ready"] = "boundary_ready"
    generated_at: datetime
    model_version: str = "deterministic-boundary-v0"
    payload: dict[str, float | str]


@app.get("/healthz")
def healthz() -> dict[str, str]:
    return {"status": "ok", "service": "gridtrade-ai"}


@app.post("/v1/predictions", response_model=PredictionResponse)
def prediction(request: PredictionRequest) -> PredictionResponse:
    # Deliberately deterministic until a validated model is introduced.
    return PredictionResponse(
        prediction_type=request.prediction_type,
        horizon=request.horizon,
        generated_at=datetime.now(timezone.utc),
        payload={
            "message": "Model boundary is ready; no production forecast is emitted yet.",
            "signal_count": str(len(request.signals)),
        },
    )