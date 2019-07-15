import firebase from 'firebase/app'
import 'firebase/firestore'

if (!firebase.apps.length) {
  const config = {
    apiKey: 'AIzaSyDE_rZuWQ-BrLFEgpIu-kMmfUFJd6L0RJE',
    authDomain: 'arithmerace.firebaseapp.com',
    databaseURL: 'https://arithmerace.firebaseio.com',
    projectId: 'arithmerace',
    storageBucket: 'arithmerace.appspot.com',
    messagingSenderId: '230702699520',
    appId: '1:230702699520:web:fbd1dae01c6e784e'
  }
  firebase.initializeApp(config)
  firebase.firestore().settings({ timestampsInSnapshots: true })
}

const fireDb = firebase.firestore()
export { fireDb }
