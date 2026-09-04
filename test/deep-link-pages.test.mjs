import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import test from 'node:test';
import vm from 'node:vm';

const websiteRoot = resolve(import.meta.dirname, '../website');

function inlineScript(html) {
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length > 0, 'script inline attendu');
  return scripts.at(-1)[1];
}

function fakeElement(initialText = '') {
  const attributes = new Map();
  const listeners = new Map();
  return {
    textContent: initialText,
    style: {},
    setAttribute(name, value) {
      attributes.set(name, value);
    },
    getAttribute(name) {
      return attributes.get(name);
    },
    removeAttribute(name) {
      attributes.delete(name);
    },
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    emit(name) {
      listeners.get(name)?.({ preventDefault() {} });
    },
  };
}

function browserContext({ pathname, search = '', hash = '', elements = {} }) {
  const location = { pathname, search, hash, href: '' };
  const document = {
    visibilityState: 'visible',
    getElementById(id) {
      return elements[id];
    },
    addEventListener() {},
    removeEventListener() {},
  };
  const window = {
    location,
    addEventListener() {},
    removeEventListener() {},
    setTimeout() {},
  };
  return {
    context: { window, document, navigator: { userAgent: '' }, URLSearchParams },
    location,
  };
}

test('le 404 conserve le token tournament-invite dans son bounce', async () => {
  const html = await readFile(resolve(websiteRoot, '404.html'), 'utf8');
  let redirectedTo;
  const window = {
    location: {
      pathname: '/tournament-invite/token_ABC-123',
      replace(value) {
        redirectedTo = value;
      },
    },
  };

  vm.runInNewContext(inlineScript(html), { window });
  assert.equal(
    redirectedTo,
    '/tournament-invite/?token=token_ABC-123',
  );
});

test('la page tournament-invite accepte uniquement un token sûr', async () => {
  const html = await readFile(
    resolve(websiteRoot, 'tournament-invite/index.html'),
    'utf8',
  );
  const elements = {
    inviteTitle: fakeElement('Rejoins ce tournoi sur Yamatch'),
    inviteBody: fakeElement("Ouvre l'app"),
    openInApp: fakeElement('Ouvrir dans Yamatch'),
  };
  const { context, location } = browserContext({
    pathname: '/tournament-invite/',
    search: '?token=token_ABC-123',
    elements,
  });

  vm.runInNewContext(inlineScript(html), context);
  assert.equal(
    elements.openInApp.getAttribute('href'),
    'com.appyamatch.yamatch://tournament-invite/token_ABC-123',
  );
  elements.openInApp.emit('click');
  assert.equal(
    location.href,
    'com.appyamatch.yamatch://tournament-invite/token_ABC-123',
  );

  const invalidElements = {
    inviteTitle: fakeElement('Rejoins ce tournoi sur Yamatch'),
    inviteBody: fakeElement("Ouvre l'app"),
    openInApp: fakeElement('Ouvrir dans Yamatch'),
  };
  const invalidBrowser = browserContext({
    pathname: '/tournament-invite/',
    search: '?token=%3Csecret%3E',
    elements: invalidElements,
  });
  vm.runInNewContext(inlineScript(html), invalidBrowser.context);
  assert.equal(invalidElements.openInApp.getAttribute('href'), undefined);
  assert.equal(invalidElements.inviteTitle.textContent, 'Invitation invalide');
  assert.doesNotMatch(
    `${invalidElements.inviteTitle.textContent}${invalidElements.inviteBody.textContent}`,
    /<secret>/,
  );
});

test('le fallback OAuth transmet les secrets à app sans les rendre', async () => {
  const html = await readFile(
    resolve(websiteRoot, 'auth/callback/index.html'),
    'utf8',
  );
  const elements = {
    openInApp: fakeElement('Ouvrir dans Yamatch'),
  };
  const { context, location } = browserContext({
    pathname: '/auth/callback/',
    search: '?code=secret-query',
    hash: '#access_token=secret-fragment',
    elements,
  });

  vm.runInNewContext(inlineScript(html), context);
  elements.openInApp.emit('click');

  assert.equal(
    location.href,
    'com.appyamatch.yamatch://auth-callback?code=secret-query#access_token=secret-fragment',
  );
  assert.match(html, /<meta name="referrer" content="no-referrer">/);
  assert.doesNotMatch(html, /console\./);
  assert.doesNotMatch(elements.openInApp.textContent, /secret-query|secret-fragment/);
});
