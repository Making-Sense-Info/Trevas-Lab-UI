import React from 'react';
import { useLocation } from 'react-router-dom';
import { Menu as WilcoMenu } from '@inseefr/wilco';
import { getEnv } from 'env';
import {
	IN_MEMORY,
	SPARK_LOCAL,
	SPARK_STATIC,
	SPARK_KUBE,
	V2_MEMORY,
	V2_CLUSTER_KUBERNETES,
} from 'utils/constants';
import './menu.scss';

const paths = [
	{ label: 'In Memory', path: `/${IN_MEMORY}` },
	{ label: 'Spark - Local', path: `/${SPARK_LOCAL}` },
	{ label: 'Spark - Static', path: `/${SPARK_STATIC}` },
	{ label: 'Spark - Kube', path: `/${SPARK_KUBE}` },
	{ label: 'Build Parquet', path: '/build-parquet', alignToRight: true },
	{ label: 'In Js', path: '/in-js', alignToRight: true },
	{ label: 'V2 - In Memory', path: `/${V2_MEMORY}`, alignToRight: true },
	{
		label: 'V2 - Spark - Kube',
		path: `/${V2_CLUSTER_KUBERNETES}`,
		alignToRight: true,
	},
];

const Menu = () => {
	const { pathname } = useLocation();

	const realPaths = paths
		.filter(({ path }) =>
			getEnv()['MODULES'].split(',').includes(path.substring(1))
		)
		.map((p) =>
			pathname === p.path || pathname.startsWith(`${p.path}/`)
				? { ...p, className: 'active' }
				: p
		);

	return (
		<div className="menu-container">
			<WilcoMenu paths={realPaths} />
		</div>
	);
};

export default Menu;
