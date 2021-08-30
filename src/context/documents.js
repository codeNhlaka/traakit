import { createContext, useEffect } from "react";
import { API, Storage } from "aws-amplify";
import { useStore } from "../store/store";
import { v4 as uuidv4 } from "uuid";
import { createDocument, deleteDocument } from "../graphql/mutations";
import { listDocuments } from "../graphql/queries";

// config amplify storage

Storage.configure({
    customPrefix: {
        public: 'public/documents/',
    }
});


const DocumentsContext = createContext(null);

const DocumentsProvider = ({ children }) => {
    const user = useStore(state => state.about);
    const setDocumentRecord = useStore(state => state.setDocumentRecord);
    const deleteDocumentRecord = useStore(state => state.deleteDocumentRecord);
    
    async function deleteDoc(documentID, documentKey){
        // delete document file from storage
        Storage.remove(documentKey).then(async response => {
           
            // delete document record from dynamodb
            const deletedRecord = await API.graphql({
                query: deleteDocument,
                variables: { input: documnentID}
            });

            if (deletedRecord.data.deleteDocument){
                const { deleteDocument } = deletedRecord.data;
                console.log(deleteDocument);

                // delete item from global state
                return deleteDocumentRecord(documentID);
            }
        }).catch(error => {
            console.log(error);
        })


    }

    async function downloadDoc(documentKey){
        // get signed url for download

        alert(documentKey)

        const signedUrl = await Storage.get(documentKey, {
            level: "public", 
            download: true
          });


        if (signedUrl){
            console.log(signedUrl);
        }
    }

    async function uploadDoc(document){
        let uploadedFile;

        // create document id
        const documentID = uuidv4();
        const { name } = document;
        let { type } = document;
        const category = "doc";

        if (type === "application/pdf") type = "pdf";

        // put file in storage

        Storage.put(documentID, document)
        .then( async (documentInfo) => {
            // get key and push to db
            const { key } = documentInfo;
            
            const documentData = {
                id: documentID,
                key,
                name,
                type,
                category
            }

            const uploadDocument = await API.graphql({query: createDocument, variables: {input: documentData }})

            if (uploadDocument.data.createDocument){
                console.log('we uploaded your file ', uploadDocument.data.createDocument);
                
                // get uploaded file
                uploadedFile = uploadDocument.data.createDocument;

                // update state
                return setDocumentRecord(uploadedFile);
            }
        })
        .catch(error => {
            console.log(error);
        })
    }

    useEffect(() => {
        // fetch user document data

        async function fetchDocuments(){
            const documents = await API.graphql({ query: listDocuments });
            
            if (documents.data.listDocuments){
                const { items } = documents.data.listDocuments;
                // push each item to state 

                items.forEach(item => {
                    const documentCounts = user.documents.length;

                    const { key } = item;
                    
                    
                    if (documentCounts !== 0){
                        
                        // avoid duplicating items, check there's an item with the same key
                        
                        for (let i = 0; i <= user.documents.length; i++){
                            let { documents } = user;
                            
                            // check for duplicate keys 

                            if (documents[i].key === key){
                                return;
                            } else {
                                setDocumentRecord(item);
                            }
                        } 
                    } else {
                        // update state
                        setDocumentRecord(item);
                    }


                })
            }
        }   

        fetchDocuments();
        
    }, []);

    return (
        <DocumentsContext.Provider value={ {uploadDoc, deleteDoc, downloadDoc} }>
            { children }
        </DocumentsContext.Provider>
    )
}

export { DocumentsContext, DocumentsProvider };