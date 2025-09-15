import { FastifyInstance } from 'fastify';
import { z } from 'zod';

// Knowledge article schema
const KnowledgeArticleSchema = z.object({
  id: z.string(),
  title: z.string(),
  category: z.enum(['physics', 'mechanical', 'thermal', 'fluid', 'structural', 'materials']),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  readTime: z.string(),
  author: z.string(),
  tags: z.array(z.string()),
  summary: z.string(),
  content: z.string(),
  relatedCalculators: z.array(z.string()),
  lastUpdated: z.string(),
});

// Knowledge base data
const knowledgeBase = [
  {
    id: 'gravity-newtons-second-law',
    title: 'Acceleration of Gravity and Newton\'s Second Law',
    category: 'physics' as const,
    difficulty: 'beginner' as const,
    readTime: '12 min read',
    author: 'EngiVault Engineering Team',
    tags: ['Gravity', 'Newton\'s Laws', 'Free Fall', 'Physics', 'Acceleration'],
    summary: 'Comprehensive guide to gravitational acceleration, Newton\'s Second Law, and free fall motion with interactive data tables and location-based gravity variations.',
    content: 'gravity-newtons-second-law',
    relatedCalculators: ['newtons-second-law', 'kinematics'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'acceleration-fundamentals',
    title: 'Acceleration Fundamentals in Engineering',
    category: 'physics' as const,
    difficulty: 'beginner' as const,
    readTime: '8 min read',
    author: 'EngiVault Engineering Team',
    tags: ['Acceleration', 'Kinematics', 'Motion', 'Physics'],
    summary: 'Complete guide to acceleration concepts, calculations, and applications in mechanical systems with velocity-time relationships.',
    content: 'acceleration-fundamentals',
    relatedCalculators: ['kinematics', 'acceleration'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'copper-tube-heat-losses',
    title: 'Copper Tube Heat Losses',
    category: 'thermal' as const,
    difficulty: 'intermediate' as const,
    readTime: '15 min read',
    author: 'EngiVault Engineering Team',
    tags: ['Heat Transfer', 'Copper Tubes', 'Thermal Analysis', 'Building Services'],
    summary: 'Comprehensive guide to heat loss calculations for uninsulated copper tubes in building services applications with interactive calculator.',
    content: 'copper-tube-heat-losses',
    relatedCalculators: ['heat-transfer', 'thermal-analysis'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'heat-exchanger-fundamentals',
    title: 'Heat Exchanger Design and Performance Analysis',
    category: 'thermal' as const,
    difficulty: 'advanced' as const,
    readTime: '12 min read',
    author: 'EngiVault Team',
    tags: ['Heat Exchangers', 'Thermal Design', 'Heat Transfer', 'Energy Efficiency', 'Heat Recovery'],
    summary: 'Comprehensive guide to heat exchanger types, design principles, and performance calculations for thermal systems.',
    content: 'heat-exchanger-fundamentals',
    relatedCalculators: ['heat-exchanger-calculator', 'thermal-analysis', 'energy-recovery'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'thermal-analysis-fundamentals',
    title: 'Thermal Analysis Fundamentals for Engineering Applications',
    category: 'thermal' as const,
    difficulty: 'intermediate' as const,
    readTime: '15 min read',
    author: 'EngiVault Team',
    tags: ['Thermal Analysis', 'Heat Transfer', 'Thermodynamics', 'Temperature', 'Energy'],
    summary: 'Comprehensive guide to thermal analysis principles, heat transfer mechanisms, and thermal system design.',
    content: 'thermal-analysis-fundamentals',
    relatedCalculators: ['thermal-analysis', 'heat-transfer', 'temperature-calculator'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'control-valve-sizing',
    title: 'Control Valve Sizing and Pressure Drop Calculations',
    category: 'fluid' as const,
    difficulty: 'intermediate' as const,
    readTime: '15 min read',
    author: 'Luqman Ismat, Founder',
    tags: ['Control Valves', 'Kv Coefficient', 'Pressure Drop', 'Flow Control'],
    summary: 'Comprehensive guidance on control valve sizing, pressure drop calculations, and valve selection for water flow applications.',
    content: 'control-valve-sizing',
    relatedCalculators: ['valve-sizing', 'flow-coefficient'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'cold-water-storage-design',
    title: 'Cold Water Storage Design for Buildings',
    category: 'fluid' as const,
    difficulty: 'intermediate' as const,
    readTime: '12 min read',
    author: 'Luqman Ismat, Founder',
    tags: ['Water Storage', 'Building Services', 'Public Health', 'Storage Design'],
    summary: 'Requirements and guidelines from CIBSE Guide G (2004) for cold water storage capacities in various building types.',
    content: 'cold-water-storage-design',
    relatedCalculators: ['water-storage', 'building-services'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'pressure-drop-fundamentals',
    title: 'Pressure Drop Fundamentals in Fluid Systems',
    category: 'fluid' as const,
    difficulty: 'intermediate' as const,
    readTime: '10 min read',
    author: 'EngiVault Team',
    tags: ['Pressure Drop', 'Fluid Flow', 'Hydraulics', 'System Design'],
    summary: 'Complete guide to pressure drop calculations, friction factors, and system design considerations for fluid systems.',
    content: 'pressure-drop-fundamentals',
    relatedCalculators: ['pressure-drop-calculator', 'flow-analysis', 'system-design'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'npsh-fundamentals',
    title: 'Net Positive Suction Head (NPSH) Fundamentals',
    category: 'fluid' as const,
    difficulty: 'intermediate' as const,
    readTime: '8 min read',
    author: 'EngiVault Team',
    tags: ['NPSH', 'Pumps', 'Cavitation', 'Suction', 'Hydraulics'],
    summary: 'Understanding NPSH requirements, calculations, and prevention of cavitation in pump systems.',
    content: 'npsh-fundamentals',
    relatedCalculators: ['npsh-calculator', 'pump-performance', 'cavitation-risk'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'valve-sizing-principles',
    title: 'Valve Sizing Principles and Flow Coefficient Calculations',
    category: 'fluid' as const,
    difficulty: 'advanced' as const,
    readTime: '10 min read',
    author: 'EngiVault Team',
    tags: ['Valves', 'Flow Coefficient', 'Sizing', 'Pressure Drop', 'Control Valves'],
    summary: 'Comprehensive guide to valve sizing, flow coefficients, and pressure drop calculations for optimal system performance.',
    content: 'valve-sizing-principles',
    relatedCalculators: ['valve-sizing-calculator', 'flow-coefficient', 'pressure-drop'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'centrifugal-pump-capacity-modulation',
    title: 'Centrifugal Pumps Capacity Modulation',
    category: 'mechanical' as const,
    difficulty: 'intermediate' as const,
    readTime: '8 min read',
    author: 'Luqman Ismat, Founder',
    tags: ['Centrifugal Pumps', 'Flow Control', 'VFD', 'Energy Efficiency'],
    summary: 'Examines the three primary methods for controlling centrifugal pump flow: throttling, bypass control, and variable frequency drives (VFDs).',
    content: 'centrifugal-pump-capacity-modulation',
    relatedCalculators: ['pump-performance', 'energy-efficiency'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'pump-performance-analysis',
    title: 'Pump Performance Analysis and System Integration',
    category: 'mechanical' as const,
    difficulty: 'advanced' as const,
    readTime: '10 min read',
    author: 'EngiVault Team',
    tags: ['Pump Performance', 'System Analysis', 'Energy Efficiency', 'Optimization'],
    summary: 'Advanced techniques for pump performance analysis, system integration, and optimization strategies.',
    content: 'pump-performance-analysis',
    relatedCalculators: ['pump-performance-calculator', 'energy-efficiency', 'system-analysis'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'material-properties',
    title: 'Material Properties for Engineering Applications',
    category: 'materials' as const,
    difficulty: 'beginner' as const,
    readTime: '12 min read',
    author: 'EngiVault Team',
    tags: ['Material Properties', 'Material Selection', 'Thermal Analysis'],
    summary: 'Comprehensive guide to material properties, selection criteria, and applications in engineering design.',
    content: 'material-properties',
    relatedCalculators: ['material-properties', 'material-selection', 'thermal-analysis'],
    lastUpdated: '2024-01-15',
  },
  {
    id: 'beam-analysis',
    title: 'Beam Analysis and Structural Design Principles',
    category: 'structural' as const,
    difficulty: 'intermediate' as const,
    readTime: '15 min read',
    author: 'EngiVault Team',
    tags: ['Beam Analysis', 'Structural Design', 'Load Analysis'],
    summary: 'Fundamental principles of beam analysis, load calculations, and structural design considerations.',
    content: 'beam-analysis',
    relatedCalculators: ['beam-analysis', 'moment-shear', 'deflection'],
    lastUpdated: '2024-01-15',
  },
];

export default async function knowledgeRoutes(fastify: FastifyInstance): Promise<void> {
  // Get all knowledge articles
  fastify.get('/knowledge', {
    schema: {
      tags: ['Knowledge Base'],
      summary: 'Get all knowledge articles',
      description: 'Retrieve all knowledge articles with optional filtering',
      querystring: z.object({
        category: z.enum(['physics', 'mechanical', 'thermal', 'fluid', 'structural', 'materials']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        search: z.string().optional(),
        limit: z.coerce.number().min(1).max(100).default(20),
        offset: z.coerce.number().min(0).default(0),
      }),
      response: {
        200: z.object({
          articles: z.array(KnowledgeArticleSchema),
          total: z.number(),
          limit: z.number(),
          offset: z.number(),
        }),
      },
    },
  }, async (request, reply) => {
    const { category, difficulty, search, limit, offset } = request.query;

    let filteredArticles = knowledgeBase;

    // Apply filters
    if (category) {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }

    if (difficulty) {
      filteredArticles = filteredArticles.filter(article => article.difficulty === difficulty);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      filteredArticles = filteredArticles.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.summary.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply pagination
    const total = filteredArticles.length;
    const paginatedArticles = filteredArticles.slice(offset, offset + limit);

    return {
      articles: paginatedArticles,
      total,
      limit,
      offset,
    };
  });

  // Get specific knowledge article
  fastify.get('/knowledge/:id', {
    schema: {
      tags: ['Knowledge Base'],
      summary: 'Get specific knowledge article',
      description: 'Retrieve a specific knowledge article by ID',
      params: z.object({
        id: z.string(),
      }),
      response: {
        200: KnowledgeArticleSchema,
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;

    const article = knowledgeBase.find(a => a.id === id);

    if (!article) {
      return reply.status(404).send({
        error: 'Article not found',
        message: `Knowledge article with ID '${id}' not found`,
      });
    }

    return article;
  });

  // Get knowledge categories
  fastify.get('/knowledge/categories', {
    schema: {
      tags: ['Knowledge Base'],
      summary: 'Get knowledge categories',
      description: 'Retrieve all available knowledge categories with article counts',
      response: {
        200: z.object({
          categories: z.array(z.object({
            name: z.string(),
            displayName: z.string(),
            description: z.string(),
            articleCount: z.number(),
          })),
        }),
      },
    },
  }, async () => {
    const categories = [
      {
        name: 'physics',
        displayName: 'Physics',
        description: 'Fundamental physics concepts and principles',
        articleCount: knowledgeBase.filter(a => a.category === 'physics').length,
      },
      {
        name: 'mechanical',
        displayName: 'Mechanical Engineering',
        description: 'Mechanical systems, pumps, and machinery',
        articleCount: knowledgeBase.filter(a => a.category === 'mechanical').length,
      },
      {
        name: 'thermal',
        displayName: 'Thermal Engineering',
        description: 'Heat transfer, thermodynamics, and thermal systems',
        articleCount: knowledgeBase.filter(a => a.category === 'thermal').length,
      },
      {
        name: 'fluid',
        displayName: 'Fluid Mechanics',
        description: 'Fluid flow, pressure, and hydraulic systems',
        articleCount: knowledgeBase.filter(a => a.category === 'fluid').length,
      },
      {
        name: 'structural',
        displayName: 'Structural Engineering',
        description: 'Structural analysis and design principles',
        articleCount: knowledgeBase.filter(a => a.category === 'structural').length,
      },
      {
        name: 'materials',
        displayName: 'Materials Engineering',
        description: 'Material properties and selection',
        articleCount: knowledgeBase.filter(a => a.category === 'materials').length,
      },
    ];

    return { categories };
  });

  // Search knowledge articles
  fastify.get('/knowledge/search', {
    schema: {
      tags: ['Knowledge Base'],
      summary: 'Search knowledge articles',
      description: 'Search knowledge articles by title, content, or tags',
      querystring: z.object({
        q: z.string().min(1),
        category: z.enum(['physics', 'mechanical', 'thermal', 'fluid', 'structural', 'materials']).optional(),
        difficulty: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
        limit: z.coerce.number().min(1).max(50).default(10),
      }),
      response: {
        200: z.object({
          results: z.array(z.object({
            article: KnowledgeArticleSchema,
            relevanceScore: z.number(),
            matchedFields: z.array(z.string()),
          })),
          total: z.number(),
          query: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { q, category, difficulty, limit } = request.query;

    const searchTerms = q.toLowerCase().split(' ').filter(term => term.length > 0);
    let filteredArticles = knowledgeBase;

    // Apply filters
    if (category) {
      filteredArticles = filteredArticles.filter(article => article.category === category);
    }

    if (difficulty) {
      filteredArticles = filteredArticles.filter(article => article.difficulty === difficulty);
    }

    // Calculate relevance scores
    const results = filteredArticles.map(article => {
      let relevanceScore = 0;
      const matchedFields: string[] = [];

      const titleLower = article.title.toLowerCase();
      const summaryLower = article.summary.toLowerCase();
      const tagsLower = article.tags.map(tag => tag.toLowerCase());

      searchTerms.forEach(term => {
        // Title matches (highest weight)
        if (titleLower.includes(term)) {
          relevanceScore += 10;
          if (!matchedFields.includes('title')) matchedFields.push('title');
        }

        // Summary matches (medium weight)
        if (summaryLower.includes(term)) {
          relevanceScore += 5;
          if (!matchedFields.includes('summary')) matchedFields.push('summary');
        }

        // Tag matches (medium weight)
        if (tagsLower.some(tag => tag.includes(term))) {
          relevanceScore += 5;
          if (!matchedFields.includes('tags')) matchedFields.push('tags');
        }
      });

      return {
        article,
        relevanceScore,
        matchedFields,
      };
    }).filter(result => result.relevanceScore > 0);

    // Sort by relevance score
    results.sort((a, b) => b.relevanceScore - a.relevanceScore);

    return {
      results: results.slice(0, limit),
      total: results.length,
      query: q,
    };
  });

  // Get related articles
  fastify.get('/knowledge/:id/related', {
    schema: {
      tags: ['Knowledge Base'],
      summary: 'Get related knowledge articles',
      description: 'Retrieve articles related to a specific knowledge article',
      params: z.object({
        id: z.string(),
      }),
      querystring: z.object({
        limit: z.coerce.number().min(1).max(10).default(5),
      }),
      response: {
        200: z.object({
          related: z.array(KnowledgeArticleSchema),
        }),
        404: z.object({
          error: z.string(),
          message: z.string(),
        }),
      },
    },
  }, async (request, reply) => {
    const { id } = request.params;
    const { limit } = request.query;

    const article = knowledgeBase.find(a => a.id === id);

    if (!article) {
      return reply.status(404).send({
        error: 'Article not found',
        message: `Knowledge article with ID '${id}' not found`,
      });
    }

    // Find related articles based on category, tags, and related calculators
    const relatedArticles = knowledgeBase
      .filter(a => a.id !== id)
      .map(a => {
        let score = 0;

        // Same category
        if (a.category === article.category) score += 10;

        // Shared tags
        const sharedTags = a.tags.filter(tag => article.tags.includes(tag));
        score += sharedTags.length * 5;

        // Shared calculators
        const sharedCalculators = a.relatedCalculators.filter(calc => 
          article.relatedCalculators.includes(calc)
        );
        score += sharedCalculators.length * 3;

        return { article: a, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.article);

    return { related: relatedArticles };
  });
}
