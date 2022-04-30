import { NextApiRequest, NextApiResponse } from 'next';
import { join } from 'path';
import swaggerJsdoc, { Options } from 'swagger-jsdoc';

type SwaggerOptions = Options & {
  apiFolder?: string;
  schemaFolders?: string[];
  outputFile?: string;
};

const defaultOptions: SwaggerOptions = {
  apiFolder: 'pages/api',
  schemaFolders: [],
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Next Swagger Doc Demo Api',
      version: '1.0',
    },
  },
};

/**
 * Create swagger JSON
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.schemaFolders entity schema folders
 * @param options.title Title
 * @param options.version Version
 * @returns Swagger JSON Spec
 */
export function createSwaggerSpec({
  apiFolder = 'pages/api',
  schemaFolders = [],
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  const scanFolders = [apiFolder, ...schemaFolders];
  const apis = scanFolders.flatMap((folder) => {
    const buildApiDirectory = join(process.cwd(), '.next/server', folder);
    const apiDirectory = join(process.cwd(), folder);
    const publicDirectory = join(process.cwd(), 'public');
    const fileTypes = ['ts', 'tsx', 'jsx', 'js', 'json', 'swagger.yaml'];
    return [
      ...fileTypes.map((fileType) => `${apiDirectory}/**/*.${fileType}`),
      // only scan build directory for *.swagger.yaml and *.js files
      ...['js', 'swagger.yaml', 'json'].map(
        (fileType) => `${buildApiDirectory}/**/*.${fileType}`,
      ),
      // support load static files from public directory
      ...['swagger.yaml', 'json'].map(
        (fileType) => `${publicDirectory}/**/*.${fileType}`,
      ),
    ];
  });
  const options: Options = {
    apis, // files containing annotations as above
    ...swaggerOptions,
  };
  const spec = swaggerJsdoc(options);

  return spec;
}

/**
 * withSwagger middleware
 * @param options.openApiVersion Open API version {3.0.0}
 * @param options.apiFolder NextJS API folder {pages/api}
 * @param options.schemaFolders entity schema folders
 * @param options.title Title
 * @param options.version Version
 * @returns
 */
export function withSwagger({
  apiFolder = 'pages/api',
  schemaFolders = [],
  ...swaggerOptions
}: SwaggerOptions = defaultOptions) {
  return () => (_req: NextApiRequest, res: NextApiResponse) => {
    try {
      const swaggerSpec = createSwaggerSpec({
        apiFolder,
        schemaFolders,
        ...swaggerOptions,
      });
      res.status(200).send(swaggerSpec);
    } catch (error) {
      res.status(400).send(error);
    }
  };
}
