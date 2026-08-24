import os
from pathlib import Path
from dotenv import load_dotenv
from pinecone import Pinecone
from google import genai

# Load root .env.local or .env
root_env = Path(__file__).resolve().parent.parent / ".env.local"
if not root_env.exists():
    root_env = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=root_env)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
PINECONE_API_KEY = os.getenv("PINECONE_API_KEY")
PINECONE_INDEX = os.getenv("PINECONE_INDEX_NAME") or os.getenv("PINECONE_INDEX") or "newreaa"
PINECONE_HOST = os.getenv("PINECONE_HOST")

print("=" * 70)
print("K-RERA VECTOR DB & EMBEDDING DIAGNOSTIC SUITE")
print("=" * 70)
print(f"Target Index: {PINECONE_INDEX}")
if PINECONE_HOST:
    print(f"Target Host: {PINECONE_HOST}")

ai_client = genai.Client(api_key=GEMINI_API_KEY)
pc = Pinecone(api_key=PINECONE_API_KEY)
index = pc.Index(name=PINECONE_INDEX, host=PINECONE_HOST) if PINECONE_HOST else pc.Index(PINECONE_INDEX)

target_complaint = "CMP/190501/0002703"
query_text = f"can you give me details on this complaint number ? {target_complaint}"
namespaces = ["rera-complaints", "rera-projects", "rera-litigation", "rera-legal"]

# Test 1: Embedding Vector Generation
print("\n[TEST 1] Generating Dense Embedding via Google API...")
vector = None
try:
    response = ai_client.models.embed_content(
        model="text-embedding-004",
        contents=query_text
    )
    vector = response.embeddings[0].values
    print(f" -> Success! Model text-embedding-004 Vector dimensionality: {len(vector)}")
except Exception as e:
    print(f" -> text-embedding-004 failed: {e}")
    try:
        print(" -> Trying with gemini-embedding-001...")
        response = ai_client.models.embed_content(
            model="gemini-embedding-001",
            contents=query_text
        )
        vector = response.embeddings[0].values
        print(f" -> Success! Model gemini-embedding-001 Vector dimensionality: {len(vector)}")
    except Exception as e2:
        print(f" -> Embedding Failed: {e2}")
        exit(1)

# Test 2: Semantic Similarity Search across all namespaces
print("\n[TEST 2] Running Dense Vector Query across 4 Namespaces (top_k=5)...")
for ns in namespaces:
    print(f"\n--- Namespace: [{ns}] ---")
    try:
        res = index.query(
            namespace=ns,
            vector=vector,
            top_k=5,
            include_metadata=True
        )
        matches = res.get("matches", [])
        if not matches:
            print(" -> 0 matches found.")
            continue

        for i, match in enumerate(matches, 1):
            score = match.get("score", 0.0)
            meta = match.get("metadata", {})
            meta_str = str(meta)
            has_id = target_complaint.lower() in meta_str.lower() or target_complaint.lower() in str(match.get('id', '')).lower()
            flag = " [MATCH!]" if has_id else ""
            print(f"  ({i}) Score: {score:.4f} | ID: {match.get('id')}{flag}")
            print(f"      Metadata Keys: {list(meta.keys())}")
            print(f"      Snippet: {meta_str[:130]}...")
    except Exception as e:
        print(f" -> Error querying [{ns}]: {e}")

# Test 3: Exact Metadata Matching (Bypassing Vector Search)
print("\n" + "=" * 70)
print("[TEST 3] Testing Direct Metadata Filter in 'rera-complaints'...")
print("=" * 70)

dummy_vector = [0.0] * len(vector)
filter_keys = ["Complaint_Number", "complaint_number", "complaintNumber", "id", "Complaint_No", "complaint_no"]

for key in filter_keys:
    try:
        filter_query = {key: {"$eq": target_complaint}}
        res = index.query(
            namespace="rera-complaints",
            vector=dummy_vector,
            top_k=5,
            filter=filter_query,
            include_metadata=True
        )
        matches = res.get("matches", [])
        print(f"Filter `{key}` returned: {len(matches)} match(es)")
        for m in matches:
            print(f" -> Record ID: {m.get('id')}")
            print(f" -> Full Metadata: {m.get('metadata')}")
    except Exception as e:
        print(f"Filter `{key}` error/not indexed: {e}")

# Extra Check: Check vector dimensionality of existing index vectors
print("\n" + "=" * 70)
print("[INDEX STATS] Inspecting Index Namespaces & Dimensions...")
print("=" * 70)
try:
    stats = index.describe_index_stats()
    print("Index Stats Summary:")
    print(f"- Dimension: {stats.get('dimension')}")
    print(f"- Total Vector Count: {stats.get('total_vector_count')}")
    print(f"- Namespaces: {stats.get('namespaces')}")
except Exception as e:
    print(f"Could not fetch stats: {e}")

print("\nDiagnostic complete.")
