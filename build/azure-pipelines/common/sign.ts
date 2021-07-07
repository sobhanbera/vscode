/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import * as cp from 'child_process';
import * as fs from 'fs';
import * as tmp from 'tmp';
import * as crypto from 'crypto';

tmp.setGracefulCleanup();

function main([esrpClientPath, cert, username, password, folderPath, pattern, params]: string[]) {
	console.log('esrpClientPath:', esrpClientPath);
	console.log('cert:', cert);
	console.log('username:', username);
	console.log('password:', password);
	console.log('folderPath:', folderPath);
	console.log('pattern:', pattern);
	console.log('params:', params);

	const args: string[] = [];
	let command = 'dotnet';
	let dotnetVersion = '';

	try {
		dotnetVersion = cp.execSync('dotnet --version', { encoding: 'utf8' }).trim();
		args.push(esrpClientPath);
	} catch {
		command = esrpClientPath;
	}

	const patternFile = tmp.fileSync();
	fs.writeFileSync(patternFile.name, pattern);

	const paramsFile = tmp.fileSync();
	fs.writeFileSync(paramsFile.name, params);

	const keyFile = tmp.fileSync();
	const key = crypto.randomBytes(32);
	const iv = crypto.randomBytes(16);
	fs.writeFileSync(keyFile.name, JSON.stringify({ key, iv }));

	const clientkeyFile = tmp.fileSync();
	const clientkeyCypher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let clientkey = clientkeyCypher.update(password, 'utf8', 'hex');
	clientkey += clientkeyCypher.final('hex');
	fs.writeFileSync(clientkeyFile.name, clientkey);

	const clientcertFile = tmp.fileSync();
	const clientcertCypher = crypto.createCipheriv('aes-256-cbc', key, iv);
	let clientcert = clientcertCypher.update(cert, 'utf8', 'hex');
	clientcert += clientcertCypher.final('hex');
	fs.writeFileSync(clientcertFile.name, clientcert);

	args.push(
		'-a', username,
		'-d', '72f988bf-86f1-41af-91ab-2d7cd011db47',
		'-k', clientkeyFile.name,
		'-z', clientcertFile.name,
		'-f', folderPath,
		'-p', patternFile.name,
		'-u', 'false',
		'-x', 'regularSigning',
		'-b', 'input.json',
		'-l', 'AzSecPack_PublisherPolicyProd.xml',
		'-y', 'inlineSignParams',
		'-j', paramsFile.name,
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
		'-e', keyFile.name,
		'-w', dotnetVersion
	);

	console.log('command:', command);
	console.log('args:', args);

	cp.spawnSync(command, args, { stdio: 'inherit' });
}

main(process.argv.slice(2));
