import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { materials, Material } from '@/data/materials';

// Request schemas
const getMaterialsQuerySchema = z.object({
  category: z.enum(['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other']).optional(),
  search: z.string().optional(),
  minDensity: z.coerce.number().optional(),
  maxDensity: z.coerce.number().optional(),
  minElasticModulus: z.coerce.number().optional(),
  maxElasticModulus: z.coerce.number().optional(),
  minTensileStrength: z.coerce.number().optional(),
  maxTensileStrength: z.coerce.number().optional(),
  minThermalConductivity: z.coerce.number().optional(),
  maxThermalConductivity: z.coerce.number().optional(),
  limit: z.coerce.number().min(1).max(100).default(50),
  offset: z.coerce.number().min(0).default(0)
});

const getMaterialParamsSchema = z.object({
  id: z.coerce.number().int().positive()
});

// Response schemas
const materialSchema = z.object({
  id: z.number(),
  name: z.string(),
  category: z.enum(['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other']),
  density: z.number(),
  elasticModulus: z.number(),
  poissonsRatio: z.number(),
  tensileStrength: z.number(),
  thermalConductivity: z.number()
});

const materialsResponseSchema = z.object({
  materials: z.array(materialSchema),
  total: z.number(),
  limit: z.number(),
  offset: z.number(),
  hasMore: z.boolean()
});

export default async function materialsRoutes(fastify: FastifyInstance): Promise<void> {
  
  // GET /materials - Get all materials with optional filtering
  fastify.get('/materials', {
    schema: {
      tags: ['Materials Database'],
      summary: 'Get materials database with filtering options',
      description: 'Retrieve materials from the comprehensive database with optional filtering by category, properties, and search terms',
      querystring: {
        type: 'object',
        properties: {
          category: {
            type: 'string',
            enum: ['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other'],
            description: 'Filter by material category'
          },
          search: {
            type: 'string',
            description: 'Search materials by name'
          },
          minDensity: {
            type: 'number',
            description: 'Minimum density (kg/m³)'
          },
          maxDensity: {
            type: 'number',
            description: 'Maximum density (kg/m³)'
          },
          minElasticModulus: {
            type: 'number',
            description: 'Minimum elastic modulus (GPa)'
          },
          maxElasticModulus: {
            type: 'number',
            description: 'Maximum elastic modulus (GPa)'
          },
          minTensileStrength: {
            type: 'number',
            description: 'Minimum tensile strength (MPa)'
          },
          maxTensileStrength: {
            type: 'number',
            description: 'Maximum tensile strength (MPa)'
          },
          minThermalConductivity: {
            type: 'number',
            description: 'Minimum thermal conductivity (W/m·K)'
          },
          maxThermalConductivity: {
            type: 'number',
            description: 'Maximum thermal conductivity (W/m·K)'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 50,
            description: 'Maximum number of materials to return'
          },
          offset: {
            type: 'number',
            minimum: 0,
            default: 0,
            description: 'Number of materials to skip'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            materials: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  category: { type: 'string', enum: ['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other'] },
                  density: { type: 'number', description: 'Density in kg/m³' },
                  elasticModulus: { type: 'number', description: 'Elastic modulus in GPa' },
                  poissonsRatio: { type: 'number', description: 'Poisson\'s ratio' },
                  tensileStrength: { type: 'number', description: 'Tensile strength in MPa' },
                  thermalConductivity: { type: 'number', description: 'Thermal conductivity in W/m·K' }
                }
              }
            },
            total: { type: 'number' },
            limit: { type: 'number' },
            offset: { type: 'number' },
            hasMore: { type: 'boolean' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = getMaterialsQuerySchema.parse(request.query);
      
      let filteredMaterials = [...materials];
      
      // Apply filters
      if (query.category) {
        filteredMaterials = filteredMaterials.filter(m => m.category === query.category);
      }
      
      if (query.search) {
        const searchTerm = query.search.toLowerCase();
        filteredMaterials = filteredMaterials.filter(m => 
          m.name.toLowerCase().includes(searchTerm)
        );
      }
      
      if (query.minDensity !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.density >= query.minDensity!);
      }
      
      if (query.maxDensity !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.density <= query.maxDensity!);
      }
      
      if (query.minElasticModulus !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.elasticModulus >= query.minElasticModulus!);
      }
      
      if (query.maxElasticModulus !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.elasticModulus <= query.maxElasticModulus!);
      }
      
      if (query.minTensileStrength !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.tensileStrength >= query.minTensileStrength!);
      }
      
      if (query.maxTensileStrength !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.tensileStrength <= query.maxTensileStrength!);
      }
      
      if (query.minThermalConductivity !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.thermalConductivity >= query.minThermalConductivity!);
      }
      
      if (query.maxThermalConductivity !== undefined) {
        filteredMaterials = filteredMaterials.filter(m => m.thermalConductivity <= query.maxThermalConductivity!);
      }
      
      const total = filteredMaterials.length;
      const hasMore = query.offset + query.limit < total;
      const paginatedMaterials = filteredMaterials.slice(query.offset, query.offset + query.limit);
      
      const response = {
        materials: paginatedMaterials,
        total,
        limit: query.limit,
        offset: query.offset,
        hasMore
      };
      
      return reply.send(response);
      
    } catch (error) {
      fastify.log.error('Error fetching materials:', error);
      return reply.status(400).send({
        error: 'Invalid request parameters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /materials/:id - Get a specific material by ID
  fastify.get('/materials/:id', {
    schema: {
      tags: ['Materials Database'],
      summary: 'Get a specific material by ID',
      description: 'Retrieve detailed information about a specific material from the database',
      params: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            description: 'Material ID'
          }
        },
        required: ['id']
      },
      response: {
        200: {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            category: { type: 'string', enum: ['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other'] },
            density: { type: 'number', description: 'Density in kg/m³' },
            elasticModulus: { type: 'number', description: 'Elastic modulus in GPa' },
            poissonsRatio: { type: 'number', description: 'Poisson\'s ratio' },
            tensileStrength: { type: 'number', description: 'Tensile strength in MPa' },
            thermalConductivity: { type: 'number', description: 'Thermal conductivity in W/m·K' }
          }
        },
        404: {
          type: 'object',
          properties: {
            error: { type: 'string' },
            message: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const params = getMaterialParamsSchema.parse(request.params);
      
      const material = materials.find(m => m.id === params.id);
      
      if (!material) {
        return reply.status(404).send({
          error: 'Material not found',
          message: `Material with ID ${params.id} does not exist`
        });
      }
      
      return reply.send(material);
      
    } catch (error) {
      fastify.log.error('Error fetching material:', error);
      return reply.status(400).send({
        error: 'Invalid request parameters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });

  // GET /materials/categories - Get all available material categories
  fastify.get('/materials/categories', {
    schema: {
      tags: ['Materials Database'],
      summary: 'Get all available material categories',
      description: 'Retrieve a list of all material categories in the database',
      response: {
        200: {
          type: 'object',
          properties: {
            categories: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  category: { type: 'string' },
                  count: { type: 'number' },
                  description: { type: 'string' }
                }
              }
            }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const categoryCounts = materials.reduce((acc, material) => {
        acc[material.category] = (acc[material.category] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      
      const categoryDescriptions: Record<string, string> = {
        'Metal': 'Metallic materials including steel, aluminum, titanium, and alloys',
        'Polymer': 'Polymer materials including plastics, rubbers, and resins',
        'Ceramic': 'Ceramic materials including glass, alumina, and silicon compounds',
        'Composite': 'Composite materials including fiber-reinforced polymers and concrete',
        'Wood': 'Natural wood materials and engineered wood products',
        'Other': 'Other materials including fluids and specialized substances'
      };
      
      const categories = Object.entries(categoryCounts).map(([category, count]) => ({
        category,
        count,
        description: categoryDescriptions[category] || 'Material category'
      }));
      
      return reply.send({ categories });
      
    } catch (error) {
      fastify.log.error('Error fetching categories:', error);
      return reply.status(500).send({
        error: 'Internal server error',
        message: 'Failed to fetch material categories'
      });
    }
  });

  // GET /materials/search - Advanced search endpoint
  fastify.get('/materials/search', {
    schema: {
      tags: ['Materials Database'],
      summary: 'Advanced material search',
      description: 'Perform advanced searches on material properties with multiple criteria',
      querystring: {
        type: 'object',
        properties: {
          q: {
            type: 'string',
            description: 'Search query for material names'
          },
          category: {
            type: 'string',
            enum: ['Metal', 'Polymer', 'Ceramic', 'Composite', 'Wood', 'Other'],
            description: 'Filter by category'
          },
          sortBy: {
            type: 'string',
            enum: ['name', 'density', 'elasticModulus', 'tensileStrength', 'thermalConductivity'],
            default: 'name',
            description: 'Sort results by property'
          },
          sortOrder: {
            type: 'string',
            enum: ['asc', 'desc'],
            default: 'asc',
            description: 'Sort order'
          },
          limit: {
            type: 'number',
            minimum: 1,
            maximum: 100,
            default: 20,
            description: 'Maximum results to return'
          }
        }
      },
      response: {
        200: {
          type: 'object',
          properties: {
            results: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'number' },
                  name: { type: 'string' },
                  category: { type: 'string' },
                  density: { type: 'number' },
                  elasticModulus: { type: 'number' },
                  poissonsRatio: { type: 'number' },
                  tensileStrength: { type: 'number' },
                  thermalConductivity: { type: 'number' }
                }
              }
            },
            total: { type: 'number' },
            query: { type: 'string' }
          }
        }
      }
    }
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const query = request.query as any;
      
      let results = [...materials];
      
      // Apply search query
      if (query.q) {
        const searchTerm = query.q.toLowerCase();
        results = results.filter(m => 
          m.name.toLowerCase().includes(searchTerm) ||
          m.category.toLowerCase().includes(searchTerm)
        );
      }
      
      // Apply category filter
      if (query.category) {
        results = results.filter(m => m.category === query.category);
      }
      
      // Sort results
      const sortBy = query.sortBy || 'name';
      const sortOrder = query.sortOrder || 'asc';
      
      results.sort((a, b) => {
        const aValue = (a as any)[sortBy];
        const bValue = (b as any)[sortBy];
        
        if (sortOrder === 'desc') {
          return bValue - aValue;
        } else {
          return aValue - bValue;
        }
      });
      
      // Apply limit
      const limit = Math.min(query.limit || 20, 100);
      results = results.slice(0, limit);
      
      return reply.send({
        results,
        total: results.length,
        query: query.q || ''
      });
      
    } catch (error) {
      fastify.log.error('Error in material search:', error);
      return reply.status(400).send({
        error: 'Invalid search parameters',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
}
