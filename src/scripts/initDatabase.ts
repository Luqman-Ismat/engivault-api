import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function initializeDatabase() {
  console.log('🚀 Initializing EngiVault SaaS Database...');

  try {
    // Create subscription plans
    const subscriptionPlans = [
      {
        name: 'Free',
        tier: 'free',
        monthlyPrice: 0,
        annualPrice: 0,
        requestsPerMonth: 1000,
        requestsPerDay: 100,
        requestsPerMinute: 10,
        features: {
          calculations: ['Basic hydraulic calculations'],
          support: 'Community support',
          analytics: 'Basic usage stats'
        }
      },
      {
        name: 'Basic',
        tier: 'basic',
        monthlyPrice: 29,
        annualPrice: 290,
        requestsPerMonth: 10000,
        requestsPerDay: 500,
        requestsPerMinute: 50,
        features: {
          calculations: ['All hydraulic calculations', 'Pump analysis', 'Network analysis'],
          support: 'Email support',
          analytics: 'Detailed usage analytics',
          apiKeys: 'Up to 5 API keys'
        }
      },
      {
        name: 'Pro',
        tier: 'pro',
        monthlyPrice: 99,
        annualPrice: 990,
        requestsPerMonth: 100000,
        requestsPerDay: 2000,
        requestsPerMinute: 200,
        features: {
          calculations: ['All calculations', 'Advanced thermal analysis', 'Custom calculations'],
          support: 'Priority email support',
          analytics: 'Advanced analytics dashboard',
          apiKeys: 'Unlimited API keys',
          integrations: 'Webhook support'
        }
      },
      {
        name: 'Enterprise',
        tier: 'enterprise',
        monthlyPrice: 299,
        annualPrice: 2990,
        requestsPerMonth: 1000000,
        requestsPerDay: 10000,
        requestsPerMinute: 1000,
        features: {
          calculations: ['All calculations', 'Custom algorithms', 'Batch processing'],
          support: 'Dedicated support team',
          analytics: 'Custom analytics and reporting',
          apiKeys: 'Unlimited API keys',
          integrations: 'Full integration support',
          sla: '99.9% uptime SLA'
        }
      }
    ];

    console.log('📋 Creating subscription plans...');
    
    for (const plan of subscriptionPlans) {
      await prisma.subscriptionPlan.upsert({
        where: { tier: plan.tier },
        update: plan,
        create: plan
      });
      console.log(`✅ Created/Updated ${plan.name} plan`);
    }

    console.log('🎉 Database initialization completed successfully!');
    console.log('\n📊 Subscription Plans Created:');
    subscriptionPlans.forEach(plan => {
      console.log(`  - ${plan.name}: $${plan.monthlyPrice}/month (${plan.requestsPerMonth} requests/month)`);
    });

    console.log('\n🚀 You can now start the API server with authentication enabled!');
    console.log('📚 API Documentation will be available at /documentation');
    console.log('🔑 Register users at POST /auth/register');

  } catch (error) {
    console.error('❌ Error initializing database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the initialization
initializeDatabase();
