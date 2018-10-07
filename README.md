    
# what-up    
> full-stack *todo* app inspired by [*TodoMVC*](http://todomvc.com/examples/react/#/) made with several latest technologies in the market.  
  
[DEMO](https://aakashrajur.github.io/what-up/)  

Read up the [`wiki`](https://github.com/aakashRajur/what-up/wiki) to understand the nuances of the code.
Feel free to open an issue if you need an explanation on any part of the same.

    
## Technologies Used 
### **Server** 
* [express](https://github.com/expressjs/express)    
* [apollo-server-express](https://github.com/apollographql/apollo-server)    
* [jsonwebtoken](https://github.com/auth0/node-jsonwebtoken)    
* [pg](https://github.com/brianc/node-postgres)    
    
### **Client** 
* [react](https://github.com/facebook/react)    
* [react-apollo](https://github.com/apollographql/react-apollo)    
    
### **Test** 
* [mocha](https://github.com/mochajs/mocha)    
* [chai](https://github.com/chaijs/chai)    
* [sinon](https://github.com/sinonjs/sinon)    
* [jest](https://github.com/facebook/jest)    
* [enzyme](https://github.com/airbnb/enzyme)    
    
## Features 
* Frontend is hosted over [**Github's CDN**](https://pages.github.com/)    
* API Server is deployed on [**Heroku**](https://www.heroku.com/) (Several CDN plugins like Cloudfront, Fastly, Edge are also available on heroku as well)    
* Postgres DB from [**Heroku**](https://www.heroku.com/)    
* [https://what-up.herokuapp.com](https://what-up.herokuapp.com/) will greet you with `hello world` * Apollo GraphQL introspection and playground available at [https://what-up.herokuapp.com/graphql](https://what-up.herokuapp.com/graphql)    
* CORS enabled for only https://what-up.herokuapp.com, [https://aakashrajur.github.io](https://aakashrajur.github.io/)    
* [Travis CI](https://travis-ci.org/) runs test on every commit push. Latest Logs [https://travis-ci.org/aakashRajur/what-up](https://travis-ci.org/aakashRajur/what-up)    
* CD enabled on heroku deploys the app after test on Travis CI succeeds.   
    
## Local Development 
* install and configure [postgres](https://www.postgresql.org/download/)    
* `git clone [https://github.com/aakashRajur/what-up.git](https://github.com/aakashRajur/what-up.git)` * `npm install` * `touch .env` * insert the following fields in your `.env` file    
```bash    
SERVER_PORT=4050    
    
#set this to test while running npm run server:test/server:test:windows  
NODE_ENV=development    
SERVER_PORT=4050  
#your postgres url, replace USER, PASSWORD(if set, skip otherwise with colon) and DB_NAME  
PG_URL=postgresql://{USER}:{PASSWORD}@localhost:5432/{DB_NAME}  
#can be any string, 256-bit WEP from https://randomkeygen.com/ was picked in my case  
SESSION_SECRET=B1DC7FE98B3E894E833582CFB3BAB  
#JWT timeout of session  
SESSION_TIMEOUT=1w  
#frontend URLs to whitelist in CORS(comma seperated)  
FRONTEND_URL=http://localhost:4000,https://example.com    
  
#frontend development server port  
PORT=4000  
REACT_APP_API_URL=http://localhost:4050/graphql  
REACT_APP_SOCKET_URL=ws://localhost:4050/graphql  
REACT_APP_TASKS_CHANGED=TASKS_CHANGED    
REACT_APP_TASK_CREATED=CREATED    
REACT_APP_TASK_COMPLETED=COMPLETED    
REACT_APP_TASK_CANCELLED=CANCELLED    
REACT_APP_TASK_ALL=ALL    
REACT_APP_SESSION_CHANGE=SESSION_CHANGE    
REACT_APP_ON_NOTIFICATION=ON_NOTIFICATION  
```    
* for running both server and app simultaneously, run `npm run dev` 
* run server separately run `npm run server` 
* run app separately run `npm run app` 
* test both frontend and backend `npm run test:local` (unix OS) and `npm run test:local:windows` (windows).