declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PAYLOAD_SECRET: string
      DATABASE_URL: string
      NEXT_PUBLIC_SERVER_URL: string
      VERCEL_PROJECT_PRODUCTION_URL: string
      CLOUDINARY_CLOUD_NAME: string
      CLOUDINARY_API_KEY: string
      CLOUDINARY_API_SECRET: string
      CLOUDINARY_FOLDER?: string
      DEEZER_API_ENDPOINT: string
      OMDB_API_KEY_URL: string
      COMIC_VINE_API_KEY_URL: string
      COMIC_VINE_API_KEY: string
      ANI_LIST_API_URL: string
      HARDCOVER_BEARER_TOKEN: string
      HARDCOVER_API_URL: string
    }
  }
}

// If this file has no import/export statements (i.e. is a script)
// convert it into a module by adding an empty export statement.
export {}
