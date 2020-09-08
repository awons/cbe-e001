const express = require('express')
const session = require('express-session')
const FileStore = require('session-file-store')(session)
const dotenv = require('dotenv')
const url = require('url')
const axios = require('axios')
const qs = require('querystring')

const csrf_protection_string = 'no-so-secret-secret'

dotenv.config();
const app = express()

app.set('view engine', 'pug')
app.use(express.static('public'))
app.use(session({
  store: new FileStore({path: '/tmp/sessions'}),
  secret: 'not so secret secret',
  resave: false,
  saveUninitialized: true,
  cookie: {
    secure: false,
    maxAge: 3600000
  }
}))
app.use((req, res, next) => {
  res.locals.AWS_REGION = process.env.AWS_REGION
  res.locals.COGNITO_IDENTITY_POOL_ID = process.env.COGNITO_IDENTITY_POOL_ID
  res.locals.COGNITO_USER_POOL_ID = process.env.COGNITO_USER_POOL_ID
  res.locals.COGNITO_SIGNOUT_URL = url.format({
    host: process.env.COGNITO_USER_POOL_HOST,
    pathname: '/logout',
    query: {
      'client_id': process.env.COGNITO_APP_CLIENT_ID,
      'logout_uri': process.env.SIGNOUT_CALLBACK
    }
  })

  next()
})

app.get('/', (req, res) => {
  res.render('index', {
    tokenData: req.session.tokenData? req.session.tokenData : null
  })
})

app.get('/login', (req, res) => {
  // First go to provider selection in Hosted UI
  const uri = url.format({
    host: process.env.COGNITO_USER_POOL_HOST,
    pathname: '/login',
    query: {
      'response_type': 'code',
      'client_id': process.env.COGNITO_APP_CLIENT_ID,
      'redirect_uri': process.env.CALLBACK_URL,
      'state': csrf_protection_string,
      'scope': 'openid email profile aws.cognito.signin.user.admin'
    }
  })

  // Skip provider selection and go directly to LinkedIn
  /*const uri = url.format({
    host: process.env.COGNITO_USER_POOL_HOST,
    pathname: '/oauth2/authorize',
    query: {
      'response_type': 'code',
      'identity_provider': process.env.COGNITO_IDENTITY_POOL_NAME,
      'scope': 'openid email profile aws.cognito.signin.user.admin',
      'client_id': process.env.COGNITO_APP_CLIENT_ID,
      'redirect_uri': process.env.CALLBACK_URL,
      'state': csrf_protection_string
    }
  })*/
  
  res.redirect(uri)
})

app.get('/auth/callback', (req, res) => {
  if (req.query.error) {
    res.send(`${req.query.error_description}: ${req.query.error}`)
    return
  }
  if (req.query.state != csrf_protection_string) {
    res.send('Invalid CSRF token')
    return
  }
  if (req.query.code) {
    axios.post(`${process.env.COGNITO_USER_POOL_HOST}/oauth2/token`, qs.stringify({
      grant_type: 'authorization_code',
      code: req.query.code,
      client_id: process.env.COGNITO_APP_CLIENT_ID,
      redirect_uri: process.env.CALLBACK_URL
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    }).then(tokenRes => {
      req.session.tokenData = tokenRes.data
      res.redirect('/')
      return
    }).catch(error => {
      console.log(error)
      res.send(error)
      return
    })
  }
})

app.get('/auth/signout', (req, res) => {
  req.session.destroy(err => {
    res.redirect('/')
  })
})

app.listen(8080)
