import React from 'react';
import {ApolloProvider} from "react-apollo";
import ReactDOM from 'react-dom';
import App from './components/App/App';
import registerServiceWorker from './registerServiceWorker';
import getApolloClient from './graphql/client';
import './index.css';

async function main() {
	await new Promise(resolve =>
		ReactDOM.render(
			<ApolloProvider client={getApolloClient()}>
				<App/>
			</ApolloProvider>,
			document.getElementById('root'),
			resolve)
	);
	await registerServiceWorker();
	return "DONE_RENDERING";
}

main().then(console.info).catch(console.error);
