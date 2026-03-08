import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const duplicateGroups = await prisma.predictionMarket.groupBy({
    by: ["eventId"],
    _count: { eventId: true },
  });

  const duplicateEventIds = duplicateGroups
    .filter((group) => group._count.eventId > 1)
    .map((group) => group.eventId);

  if (duplicateEventIds.length === 0) {
    console.log("No multi-market event rows found.");
    return;
  }

  const affectedMarketCount = await prisma.predictionMarket.count({
    where: { eventId: { in: duplicateEventIds } },
  });

  const affectedLinkCount = await prisma.articlePredictionMarket.count({
    where: {
      predictionMarket: {
        eventId: { in: duplicateEventIds },
      },
    },
  });

  const sample = await prisma.predictionMarket.findMany({
    where: { eventId: { in: duplicateEventIds } },
    select: { eventId: true, question: true, id: true },
    orderBy: [{ eventId: "asc" }, { updatedAt: "desc" }],
    take: 10,
  });

  console.log(
    JSON.stringify(
      {
        duplicateEventIds: duplicateEventIds.length,
        affectedMarketCount,
        affectedLinkCount,
        sample,
      },
      null,
      2,
    ),
  );

  const deleted = await prisma.$transaction(async (tx) => {
    const deletedLinks = await tx.articlePredictionMarket.deleteMany({
      where: {
        predictionMarket: {
          eventId: { in: duplicateEventIds },
        },
      },
    });

    const deletedMarkets = await tx.predictionMarket.deleteMany({
      where: { eventId: { in: duplicateEventIds } },
    });

    return {
      deletedLinks: deletedLinks.count,
      deletedMarkets: deletedMarkets.count,
    };
  });

  console.log(JSON.stringify(deleted, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
