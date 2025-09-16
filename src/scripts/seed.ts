import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedDatabase(): Promise<void> {
  try {
    console.log('🌱 Seeding database...');

    // Create subscription plans
    const subscriptionPlans = [
      {
        name: 'Free',
        tier: 'free',
        monthlyPrice: 0,
        annualPrice: 0,
        requestsPerMonth: 100,
        requestsPerDay: 10,
        requestsPerMinute: 5,
        features: {
          basicCalculations: true,
          apiKeys: 1,
          support: 'community',
        },
      },
      {
        name: 'Basic',
        tier: 'basic',
        monthlyPrice: 29,
        annualPrice: 290,
        requestsPerMonth: 1000,
        requestsPerDay: 50,
        requestsPerMinute: 10,
        features: {
          basicCalculations: true,
          advancedCalculations: true,
          apiKeys: 5,
          support: 'email',
          analytics: true,
        },
      },
      {
        name: 'Pro',
        tier: 'pro',
        monthlyPrice: 99,
        annualPrice: 990,
        requestsPerMonth: 10000,
        requestsPerDay: 500,
        requestsPerMinute: 50,
        features: {
          basicCalculations: true,
          advancedCalculations: true,
          premiumCalculations: true,
          apiKeys: -1, // unlimited
          support: 'priority',
          analytics: true,
          webhooks: true,
          batchProcessing: true,
        },
      },
      {
        name: 'Enterprise',
        tier: 'enterprise',
        monthlyPrice: 299,
        annualPrice: 2990,
        requestsPerMonth: 100000,
        requestsPerDay: 5000,
        requestsPerMinute: 200,
        features: {
          basicCalculations: true,
          advancedCalculations: true,
          premiumCalculations: true,
          customCalculations: true,
          apiKeys: -1, // unlimited
          support: 'dedicated',
          analytics: true,
          webhooks: true,
          batchProcessing: true,
          customIntegrations: true,
          sla: '99.9%',
        },
      },
    ];

    for (const plan of subscriptionPlans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        update: plan,
        create: plan,
      });
      console.log(`✅ Created/updated subscription plan: ${plan.name}`);
    }

    console.log('🎉 Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seed function
seedDatabase()
  .then(() => {
    console.log('✅ Seeding completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  });
