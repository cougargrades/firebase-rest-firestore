import { DocumentReference } from "../client"
import {
  FirestoreDocument,
  FirestoreFieldValue,
  FirestoreLiteralDocumentReference,
  FirestoreLiteralGeoPointValue,
  FirestoreResponse,
} from "../types";
import { getDocumentId } from "./path";

/**
 * JSの値をFirestore形式に変換する
 * @param value 変換する値
 * @returns Firestore形式の値
 */
export function convertToFirestoreValue(value: any): FirestoreFieldValue {
  // store in temporary variable to enable TypeScript to be more thorough
  let unknown: unknown = value;
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  } else if (value instanceof DocumentReference) {
    return { referenceValue: value['client']['pathUtil'].getParentReference(value.path) } satisfies FirestoreLiteralDocumentReference;
  } else if (typeof value === "string") {
    return { stringValue: value };
  } else if (typeof value === "number") {
    return Number.isInteger(value)
      ? { integerValue: value }
      : { doubleValue: value };
  } else if (typeof value === "boolean") {
    return { booleanValue: value };
  } else if (value === null || value === undefined) {
    return { nullValue: null };
  } else if (Array.isArray(value)) {
    return {
      arrayValue: {
        values: value.map(item => convertToFirestoreValue(item)),
      },
    };
  } else if (typeof value === "object") {

    // Check for "special" shapes
    // Check that value matches exact shape of Document Reference
    if (
      typeof unknown === 'object'
      && !!unknown && 'referenceValue' in unknown
      && Object.keys(unknown).length === 1
      && typeof unknown.referenceValue === 'string'
    ) {
      // value is an not-null object like `{ referenceValue: string }` with exactly 1 property, and that 1 property is a string
      return { referenceValue: unknown.referenceValue } satisfies FirestoreLiteralDocumentReference
    }
    // Check that value matches exact shape of GeoPoint
    else if (
      typeof unknown === 'object'
      && !!unknown
      && 'geoPointValue' in unknown
      && Object.keys(unknown).length === 1
      && typeof unknown.geoPointValue === 'object'
      && !!unknown.geoPointValue
      && 'latitude' in unknown.geoPointValue
      && 'longitude' in unknown.geoPointValue
      && Object.keys(unknown.geoPointValue).length === 1
      && typeof unknown.geoPointValue.latitude === 'number'
      && typeof unknown.geoPointValue.longitude === 'number'
    ) {
      return { geoPointValue: { latitude: unknown.geoPointValue.latitude, longitude: unknown.geoPointValue.longitude }} satisfies FirestoreLiteralGeoPointValue
    }

    const fields = Object.entries(value).reduce(
      (acc, [key, val]) => ({
        ...acc,
        [key]: convertToFirestoreValue(val),
      }),
      {}
    );
    return { mapValue: { fields } };
  }

  // デフォルトは文字列化
  return { stringValue: String(value) };
}

/**
 * Firestore形式からJSの値に変換する
 * @param firestoreValue Firestore形式の値
 * @returns JS形式の値
 */
export function convertFromFirestoreValue(
  firestoreValue: FirestoreFieldValue
): any {
  if ("stringValue" in firestoreValue) {
    return firestoreValue.stringValue;
  } else if ("integerValue" in firestoreValue) {
    return Number(firestoreValue.integerValue);
  } else if ("doubleValue" in firestoreValue) {
    return firestoreValue.doubleValue;
  } else if ("booleanValue" in firestoreValue) {
    return firestoreValue.booleanValue;
  } else if ("nullValue" in firestoreValue) {
    return null;
  } else if ("timestampValue" in firestoreValue) {
    return new Date(firestoreValue.timestampValue);
  } else if ("geoPointValue" in firestoreValue) {
    return firestoreValue satisfies FirestoreLiteralGeoPointValue
  } else if ("referenceValue" in firestoreValue) {
    return firestoreValue satisfies FirestoreLiteralDocumentReference
  } else if ("mapValue" in firestoreValue && firestoreValue.mapValue.fields) {
    return Object.entries(firestoreValue.mapValue.fields).reduce(
      (acc, [key, val]) => ({
        ...acc,
        [key]: convertFromFirestoreValue(val),
      }),
      {}
    );
  } else if (
    "arrayValue" in firestoreValue &&
    firestoreValue.arrayValue.values
  ) {
    return firestoreValue.arrayValue.values.map(convertFromFirestoreValue);
  }

  return null;
}

/**
 * オブジェクトをFirestoreドキュメント形式に変換
 * @param data 変換するオブジェクト
 * @returns Firestoreドキュメント
 */
export function convertToFirestoreDocument(
  data: Record<string, any>
): FirestoreDocument {
  return {
    fields: Object.entries(data).reduce(
      (acc, [key, value]) => ({
        ...acc,
        [key]: convertToFirestoreValue(value),
      }),
      {}
    ),
  };
}

/**
 * Firestoreドキュメントをオブジェクトに変換
 * @param doc Firestoreレスポンス
 * @returns 変換されたオブジェクト（idプロパティ付き）
 */
export function convertFromFirestoreDocument(
  doc: FirestoreResponse
): Record<string, any> & { id: string } {
  if (!doc.fields) return { id: getDocumentId(doc.name) };

  const result = Object.entries(doc.fields).reduce(
    (acc, [key, value]) => ({
      ...acc,
      [key]: convertFromFirestoreValue(value),
    }),
    {}
  );

  return {
    ...result,
    id: getDocumentId(doc.name),
  };
}
