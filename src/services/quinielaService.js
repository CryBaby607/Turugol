import { db } from '../firebase/config';
import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    doc, 
    getDoc, 
    updateDoc, 
    increment, 
    addDoc, 
    serverTimestamp,
    deleteDoc,
    where,
    getCountFromServer 
} from 'firebase/firestore';

export const quinielaService = {
    async getActive() {
        const now = new Date();
        const q = query(collection(db, "quinielas"), orderBy("metadata.deadline", "desc"));
        const snap = await getDocs(q);
        return snap.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .filter(q => q.metadata.deadline?.toDate() > now);
    },

    async getAll() {
        const q = query(collection(db, "quinielas"), orderBy("metadata.createdAt", "desc"));
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    },

    async getById(id) {
        const ref = doc(db, 'quinielas', id);
        const snap = await getDoc(ref);
        return snap.exists() ? { id: snap.id, ...snap.data() } : null;
    },

    async delete(id) {
        await deleteDoc(doc(db, "quinielas", id));
    },

    async submitEntry(entryData) {
        const docRef = await addDoc(collection(db, 'userEntries'), {
            ...entryData,
            createdAt: serverTimestamp(),
            status: 'active',
            paymentStatus: 'pending',
            puntos: 0
        });

        const quinielaRef = doc(db, 'quinielas', entryData.quinielaId);
        await updateDoc(quinielaRef, {
            'metadata.participantCount': increment(1)
        });

        return docRef;
    },

    async deleteEntry(entryId, quinielaId) {
        await deleteDoc(doc(db, "userEntries", entryId));

        const quinielaRef = doc(db, 'quinielas', quinielaId);
        await updateDoc(quinielaRef, {
            'metadata.participantCount': increment(-1)
        });
    },

    async recalculateAllCounts() {
        const quinielasSnap = await getDocs(collection(db, "quinielas"));
        const promises = quinielasSnap.docs.map(async (qDoc) => {
            const qId = qDoc.id;
            const countQuery = query(collection(db, "userEntries"), where("quinielaId", "==", qId));
            const snapshot = await getCountFromServer(countQuery);
            await updateDoc(doc(db, "quinielas", qId), {
                "metadata.participantCount": snapshot.data().count
            });
        });
        await Promise.all(promises);
    }
};