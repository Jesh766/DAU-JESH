import { Router, type IRouter } from "express";
import {
  CreateListingBody,
  CreateSolarSystemBody,
  GetActivityFeedQueryParams,
  GetActivityFeedResponse,
  GetAuthSessionResponse,
  GetDashboardSummaryResponse,
  GetEnergyOverviewQueryParams,
  GetEnergyOverviewResponse,
  GetGridStatusResponse,
  GetMatchRecommendationsResponse,
  ListListingsQueryParams,
  ListListingsResponse,
  ListSolarSystemsResponse,
} from "@workspace/api-zod";
import { calculateSurplus, assertPositiveEnergy, assertValidAvailability } from "../domain/energy";
import { scoreMatch } from "../domain/matching";
import { AppError } from "../middleware/errors";
import { demoStore } from "../data/demo-store";

const router: IRouter = Router();

router.get("/v1/dashboard/summary", (_req, res) => {
  const marketableSurplusKwh = demoStore.energy.reduce(
    (total, observation) => total + observation.marketableSurplusKwh,
    0,
  );
  const currentPriceInrPerKwh = Math.min(
    ...demoStore.listings
      .filter((listing) => listing.status === "active")
      .map((listing) => listing.priceInrPerKwh),
  );
  res.json(
    GetDashboardSummaryResponse.parse({
      marketableSurplusKwh: Number(marketableSurplusKwh.toFixed(2)),
      activeListings: demoStore.listings.filter((listing) => listing.status === "active")
        .length,
      activeProsumers: 184,
      currentPriceInrPerKwh,
      gridDecision: demoStore.gridDecision,
      gridLabel: demoStore.gridLabel,
      carbonAvoidedKg: Number((marketableSurplusKwh * 0.68).toFixed(2)),
      energyTrend: demoStore.energy,
    }),
  );
});

router.get("/v1/activity", (req, res) => {
  const params = GetActivityFeedQueryParams.parse(req.query);
  res.json(GetActivityFeedResponse.parse(demoStore.activity.slice(0, params.limit)));
});

router.get("/v1/solar-systems", (_req, res) => {
  res.json(ListSolarSystemsResponse.parse(demoStore.solarSystems));
});

router.post("/v1/solar-systems", (req, res, next) => {
  try {
    const input = CreateSolarSystemBody.parse(req.body);
    const system = demoStore.addSolarSystem(input);
    res.status(201).json(system);
  } catch (error) {
    next(new AppError("INVALID_SOLAR_SYSTEM", error instanceof Error ? error.message : "Invalid solar system", 400));
  }
});

router.get("/v1/energy-data", (req, res) => {
  GetEnergyOverviewQueryParams.parse(req.query);
  res.json(GetEnergyOverviewResponse.parse(demoStore.energy));
});

router.get("/v1/listings", (req, res) => {
  const params = ListListingsQueryParams.parse(req.query);
  const listings = demoStore.listings.filter(
    (listing) => !params.status || listing.status === params.status,
  );
  res.json(ListListingsResponse.parse(listings.slice(0, params.limit)));
});

router.post("/v1/listings", (req, res, next) => {
  try {
    const input = CreateListingBody.parse(req.body);
    assertPositiveEnergy(String(input.quantityKwh), "quantityKwh");
    const availableFrom = new Date(input.availableFrom);
    const availableUntil = new Date(input.availableUntil);
    assertValidAvailability(availableFrom, availableUntil);
    const listing = demoStore.addListing({
      ...input,
      availableFrom,
      availableUntil,
    });
    res.status(201).json(listing);
  } catch (error) {
    next(new AppError("INVALID_LISTING", error instanceof Error ? error.message : "Invalid listing", 400));
  }
});

router.get("/v1/grid/status", (_req, res) => {
  res.json(
    GetGridStatusResponse.parse({
      decision: demoStore.gridDecision,
      label: demoStore.gridLabel,
      ...demoStore.gridInputs,
      updatedAt: new Date(),
    }),
  );
});

router.get("/v1/matching/recommendations", (_req, res) => {
  const recommendations = demoStore.listings
    .filter((listing) => listing.status === "active")
    .map((listing, index) => {
      const score = scoreMatch({
        id: listing.id,
        sellerName: listing.sellerName,
        location: listing.location,
        quantityKwh: listing.quantityKwh,
        priceInrPerKwh: listing.priceInrPerKwh,
        gridDecision: listing.gridDecision,
        distanceKm: index === 0 ? 1.4 : index === 1 ? 3.8 : 6.2,
        reliabilityScore: index === 0 ? 96 : index === 1 ? 89 : 82,
      });
      return {
        id: `match-${listing.id}`,
        listingId: listing.id,
        sellerName: listing.sellerName,
        location: listing.location,
        quantityKwh: listing.quantityKwh,
        priceInrPerKwh: listing.priceInrPerKwh,
        score,
        rationale:
          index === 0
            ? "Closest approved supply with a strong quantity fit."
            : "Good price and reliability; grid suitability slightly lowers the rank.",
        factors: [
          `${index === 0 ? "1.4" : index === 1 ? "3.8" : "6.2"} km proximity`,
          `${index === 0 ? "96" : index === 1 ? "89" : "82"}% reliability`,
          listing.gridDecision === "APPROVED" ? "approved grid window" : "adjusted grid window",
        ],
      };
    })
    .sort((a, b) => b.score - a.score);
  res.json(GetMatchRecommendationsResponse.parse(recommendations));
});

router.get("/v1/auth/session", (req, res) => {
  res.json(
    GetAuthSessionResponse.parse({
      authenticated: Boolean(req.authContext),
      role: req.authContext?.role ?? "PROSUMER",
      displayName: req.authContext?.displayName ?? "Guest",
    }),
  );
});

export default router;