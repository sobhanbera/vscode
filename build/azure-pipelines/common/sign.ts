/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as crypto from 'crypto';

tmp.setGracefulCleanup();

function main([esrpCliPath, cert, username, password, folderPath, pattern, paramsPath]: string[]) {
	console.log('esrpCliPath:', esrpCliPath);
	console.log('cert:', cert);
	console.log('username:', username);
	console.log('password:', password);
	console.log('folderPath:', folderPath);
	console.log('pattern:', pattern);
	console.log('paramsPath:', paramsPath);

	const patternFile = tmp.tmpNameSync();
	fs.writeFileSync(patternFile, pattern);

	const keyFile = tmp.tmpNameSync();
	const key = crypto.randomBytes(32);
	const iv = crypto.randomBytes(16);
	fs.writeFileSync(keyFile, JSON.stringify({ key: key.toString('hex'), iv: iv.toString('hex') }));

	const clientkeyFile = tmp.tmpNameSync();
	const clientkeyCypher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let clientkey = clientkeyCypher.update(password, 'utf8', 'hex');
	clientkey += clientkeyCypher.final('hex');
	fs.writeFileSync(clientkeyFile, clientkey);

	const clientcertFile = tmp.tmpNameSync();
	const clientcertCypher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let clientcert = clientcertCypher.update(cert, 'utf8', 'hex');
	clientcert += clientcertCypher.final('hex');
	fs.writeFileSync(clientcertFile, clientcert);

	const args = [
		esrpCliPath,
		'vsts.sign',
		'-a', username,
		'-k', clientkeyFile,
		'-z', clientcertFile,
		'-f', folderPath,
		'-p', patternFile,
		'-u', 'false',
		'-x', 'regularSigning',
		'-b', 'input.json',
		'-l', 'AzSecPack_PublisherPolicyProd.xml',
		'-y', 'inlineSignParams',
		'-j', paramsPath,
		'-c', '9997',
		'-t', '120',
		'-g', '10',
		'-v', 'Tls12',
		'-s', 'https://api.esrp.microsoft.com/api/v1',
		'-m', '0',
		'-o', 'Microsoft',
		'-i', 'https://www.microsoft.com',
		'-n', '5',
		'-r', 'true',
		'-e', keyFile,
	];

	console.log('args:', args);

	cp.spawnSync('dotnet', args, { stdio: 'inherit' });
}

main(process.argv.slice(2));
