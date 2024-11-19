//server component
let endpoint = "http://127.0.0.1:5000/api/resource"
import { Collection} from './types';

export async function serverGetResource(resource_name: string, req_json: string | null = null, is_resource_name_endpoint:boolean = false) {
    let response: any
    let func_endpoint = is_resource_name_endpoint ? `${endpoint}/${resource_name}` : `${endpoint}?name=${resource_name}`;
    if (req_json) {
        const encoded_json = encodeURI(req_json);
        const queryPrefix = is_resource_name_endpoint ? "?json=" : "&json=";
        func_endpoint += queryPrefix + encoded_json;
    }
    response = await fetch(func_endpoint, {
        cache: 'no-cache',
        headers: {
            "Content-Type": "application/json"
        },
    });
    const data = await response.json();
    if (!response.ok) {
        throw new Error(data.errors?.map((error: any) => error.message).join('\n') || 'Error fetching data');
    }
    return data;
}

export async function serverPostResource(resource_name: string, req_json: string, is_resource_name_endpoint:boolean = false) {
    let func_endpoint:string
    func_endpoint = is_resource_name_endpoint ? endpoint + `/${resource_name}` : `${endpoint}?name=${resource_name}`;
    const response = await fetch(func_endpoint, {
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: req_json
    });
    const data = await response.json();
    if (!response.ok) {
        console.error("Server responded with an error:", data);
        throw new Error(data.errors?.map((error: any) => error.message).join('\n') || 'Error posting data');
    }
    return data;
}

export function getResource(resource_name: string, req_json: string = '', is_resource_name_endpoint:boolean = false): Promise<any> {
    const encoded_json = encodeURI(req_json)
    let func_endpoint = is_resource_name_endpoint ? `${endpoint}/${resource_name}` : `${endpoint}?name=${resource_name}`;
    if (req_json) {
        const encoded_json = encodeURI(req_json);
        const queryPrefix = is_resource_name_endpoint ? "?json=" : "&json=";
        func_endpoint += queryPrefix + encoded_json;
    }
    return fetch(func_endpoint, { cache: "no-store"})
        .then((response) => {
            if (!response.ok) {
                throw new Error("Response not ok")
            }
            return response.json();
        })
        .catch(error => {
            throw error;
        });
}

export function postResource(resource_name: string, req_json: string, is_resource_name_endpoint:boolean = false): Promise<any> {
    let func_endpoint:string
    func_endpoint = is_resource_name_endpoint ? endpoint + `/${resource_name}` : `${endpoint}?name=${resource_name}`;
    return fetch(func_endpoint, {
        cache: 'no-store',
        method: 'POST',
        headers: {
            "Content-Type": "application/json"
        },
        body: req_json
    },).then(
        response => {
            if (!response.ok) {
                throw new Error("Response not ok")
            }
            return response.json();
        })
        .catch(error => {
            console.error("some error: ", error)
        })
}

export async function getCollectionStructure(): Promise<Collection[]> {
  try {
    const response = await serverGetResource('get_collection_structure');

    if (response.data && response.data.editor_collections) {
      const collections = response.data.editor_collections;
      return buildCollectionTree(collections);
    }
    return [];
  } catch (error) {
    console.error("Error getting collection structure:", error);
    return [];
  }
}

export async function saveCollectionStructure(structure: Collection[]): Promise<void> {
  try {
    const flatStructure = flattenCollectionStructure(structure);
    if (flatStructure.length === 0) {
      console.warn("Attempting to save an empty collection structure");
      return;
    }
    const response = await serverPostResource('save_collection_structure', JSON.stringify({
        collections: flatStructure
    }));
  } catch (error) {
    console.error("Error saving collection structure:", error);
    throw error;
  }
}

// Helper function to build the collection tree
function buildCollectionTree(flatCollections: any[]): Collection[] {
  const collectionsMap = new Map<string, Collection>();

  // First pass: create all collections
  flatCollections.forEach(col => {
    collectionsMap.set(col.collection_id, {
      id: col.collection_id,
      name: col.collection_name,
      files: col.editor_files ? col.editor_files.map((file: any) => ({ id: file.file_id, name: file.file_name })) : [],
      collections: [],
      isOpen: false
    });
  });

  // Second pass: build the tree structure
  const rootCollections: Collection[] = [];
  flatCollections.forEach(col => {
    const collection = collectionsMap.get(col.collection_id);
    if (collection) {
      if (col.parent_id) {
        const parent = collectionsMap.get(col.parent_id);
        if (parent) {
          parent.collections.push(collection);
        } else {
          // If parent is not found, add to root
          rootCollections.push(collection);
        }
      } else {
        rootCollections.push(collection);
      }
    }
  });
  
  return rootCollections;
}

// Helper function to flatten the collection structure for saving
function flattenCollectionStructure(collections: Collection[]): any[] {
  let result: any[] = [];

  function flatten(col: Collection, parentId: string | null = null) {
    result.push({
      collection_id: col.id,
      collection_name: col.name,
      parent_id: parentId,
      deleted: false // Add this line to include the deleted field
    });

    col.collections.forEach(subCol => flatten(subCol, col.id));
  }

  collections.forEach(col => flatten(col));

  return result;
}

// Modify the existing saveFile function
export async function saveFile(collectionId: string, fileId: string | null, fileName: string, content: string) {
  try {
    let endpoint = 'create_file';
    let fileExists = false;

    if (fileId) {
      const existingFile = await getFile(fileId);
      fileExists = !!existingFile.data.editor_files[0];
      if (fileExists) {
        endpoint = 'update_file';
      }
    }

    const response = await serverPostResource(endpoint, JSON.stringify({
      collection_id: collectionId,
      file_id: fileId,
      file_name: fileName,
      content: content
    }));

    // After saving the file, update the collection structure
    await getCollectionStructure();

    return response;
  } catch (error) {
    console.error("Error saving file:", error);
    throw error;
  }
}

// Add this new function to get file information
export async function getFile(fileId: string) {
    try {
        const response = await serverGetResource('get_file', JSON.stringify({ file_id: fileId }));
        return response;
    } catch (error) {
        console.error("Error getting file:", error);
        return null;
    }
}

// Add this new function to delete a file
export async function deleteFile(fileId: string) {
    try {
        const response = await serverPostResource('delete_editor_file', JSON.stringify({
            file_id: fileId
        }));
        return response;
    } catch (error) {
        console.error("Error deleting file:", error);
        throw error;
    }
}

// Add this new function to rename a collection
export async function renameCollection(collectionId: string, newName: string) {
    try {
        const response = await serverPostResource('rename_collection', JSON.stringify({
            collection_id: collectionId,
            collection_name: newName
        }));
        return response;
    } catch (error) {
        console.error("Error renaming collection:", error);
        throw error;
    }
}

// Add this new function to delete a collection
export async function deleteCollection(collectionId: string) {
    try {
        const response = await serverPostResource('delete_editor_collection', JSON.stringify({
            collection_id: collectionId
        }));
        return response;
    } catch (error) {
        console.error("Error deleting collection:", error);
        throw error;
    }
}
