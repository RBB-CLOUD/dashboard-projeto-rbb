import { SpotifyApi } from "@spotify/web-api-ts-sdk";
import { Resend } from 'resend';
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import { Octokit } from '@octokit/rest';

let spotifyConnectionSettings: any;
let resendConnectionSettings: any;
let githubConnectionSettings: any;

async function getSpotifyAccessToken() {
  if (spotifyConnectionSettings && spotifyConnectionSettings.settings.expires_at && new Date(spotifyConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return spotifyConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  spotifyConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=spotify',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);
  
  const refreshToken = spotifyConnectionSettings?.settings?.oauth?.credentials?.refresh_token;
  const accessToken = spotifyConnectionSettings?.settings?.access_token || spotifyConnectionSettings.settings?.oauth?.credentials?.access_token;
  const clientId = spotifyConnectionSettings?.settings?.oauth?.credentials?.client_id;
  const expiresIn = spotifyConnectionSettings.settings?.oauth?.credentials?.expires_in;
  
  if (!spotifyConnectionSettings || (!accessToken || !clientId || !refreshToken)) {
    throw new Error('Spotify not connected');
  }
  
  return {accessToken, clientId, refreshToken, expiresIn};
}

async function getResendCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  resendConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!resendConnectionSettings || (!resendConnectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  
  return {
    apiKey: resendConnectionSettings.settings.api_key, 
    fromEmail: resendConnectionSettings.settings.from_email
  };
}

async function getGitHubAccessToken() {
  if (githubConnectionSettings && githubConnectionSettings.settings.expires_at && new Date(githubConnectionSettings.settings.expires_at).getTime() > Date.now()) {
    return githubConnectionSettings.settings.access_token;
  }
  
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  githubConnectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=github',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  const accessToken = githubConnectionSettings?.settings?.access_token || githubConnectionSettings.settings?.oauth?.credentials?.access_token;

  if (!githubConnectionSettings || !accessToken) {
    throw new Error('GitHub not connected');
  }
  
  return accessToken;
}

export async function getSpotifyClient() {
  const {accessToken, clientId, refreshToken, expiresIn} = await getSpotifyAccessToken();

  const spotify = SpotifyApi.withAccessToken(clientId, {
    access_token: accessToken,
    token_type: "Bearer",
    expires_in: expiresIn || 3600,
    refresh_token: refreshToken,
  });

  return spotify;
}

export async function getResendClient() {
  const {apiKey, fromEmail} = await getResendCredentials();
  return {
    client: new Resend(apiKey),
    fromEmail: fromEmail
  };
}

export function getOpenAIClient() {
  const openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
  return openai;
}

export function getAnthropicClient() {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  return anthropic;
}

export async function getGitHubClient() {
  const accessToken = await getGitHubAccessToken();
  return new Octokit({ auth: accessToken });
}

export const RBB_APIs = {
  spotify: getSpotifyClient,
  resend: getResendClient,
  openai: getOpenAIClient,
  anthropic: getAnthropicClient,
  github: getGitHubClient
};
