import React from 'react';
import {ApolloProvider} from "react-apollo";
import ReactDOM from 'react-dom';
import App from './components/App/App';
import './index.css';
import registerServiceWorker from './registerServiceWorker';
import client from './utils/apollo';

async function main() {
	await new Promise(resolve =>
		ReactDOM.render(
			<ApolloProvider client={client}>
				<App/>
			</ApolloProvider>,
			document.getElementById('root'),
			resolve)
	);
	await registerServiceWorker();
	return "DONE_RENDERING";
}

main().then(console.log).catch(console.error);

