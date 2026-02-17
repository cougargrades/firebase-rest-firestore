/**
 * Firestoreクライアントの設定インターフェース
 */
export interface FirestoreConfig {
  projectId: string;
  privateKey: string;
  clientEmail: string;
  databaseId?: string;
  debug?: boolean;
  useEmulator?: boolean;
  emulatorHost?: string;
  emulatorPort?: number;
}

// A reference to a document. For example: `projects/{project_id}/databases/{database_id}/documents/{document_path}`.
export type FirestoreLiteralDocumentReference = { referenceValue: string }
/**
 * A geo point value representing a point on the surface of Earth.
 */
export type FirestoreLiteralGeoPointValue = {
  geoPointValue: {
    /**
     * The latitude in degrees. It must be in the range [-90.0, +90.0].
     */
    latitude: number,
    /**
     * The longitude in degrees. It must be in the range [-180.0, +180.0].
     */
    longitude: number
  } 
};

/**
 * Firestoreの値型定義
 * See: https://github.com/googleapis/google-api-nodejs-client/blob/5870dfe31f4885eebc82c19f7471c50403308f26/src/apis/firestore/v1.ts#L2246
 */
export type FirestoreFieldValue =
  | { stringValue: string }
  | { integerValue: number }
  | { doubleValue: number }
  | { booleanValue: boolean }
  | { nullValue: null }
  | { timestampValue: string }
  | FirestoreLiteralGeoPointValue
  | FirestoreLiteralDocumentReference
  | { mapValue: { fields: Record<string, FirestoreFieldValue> } }
  | { arrayValue: { values: FirestoreFieldValue[] } };

/**
 * Firestoreドキュメント型
 */
export interface FirestoreDocument {
  name?: string;
  fields: Record<string, FirestoreFieldValue>;
  createTime?: string;
  updateTime?: string;
}

/**
 * Firestoreレスポンス型
 */
export interface FirestoreResponse {
  name: string;
  fields?: Record<string, FirestoreFieldValue>;
  createTime?: string;
  updateTime?: string;
}

/**
 * クエリオプション型
 */
export interface QueryOptions {
  where?: Array<{ field: string; op: string; value: any }>;
  orderBy?: string;
  orderDirection?: string;
  limit?: number;
  offset?: number;
}
