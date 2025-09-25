import { Children } from "react";
import type { ReactElement } from "react";

type ChildrenProps = {
	isTrue: boolean;
	children: ReactElement | Array<ReactElement>;
};

type Props = {
	children: Array<ReactElement<ChildrenProps>>;
};

export const Show = (props: Readonly<Props>) => {
	let when: ReactElement | null = null;
	let otherwise: ReactElement | null = null;

	Children.forEach(props.children, children => {
		if (children?.props?.isTrue === undefined) {
			otherwise = children;
		} else if (!when && !!children?.props?.isTrue) {
			when = children;
		}
	});

	return when ?? otherwise;
};

Show.When = ({ isTrue, children }: Readonly<ChildrenProps>) => <>{isTrue ? children : null}</>;

Show.Else = ({ children }: Readonly<Omit<ChildrenProps, "isTrue">>) => <>{children}</>;
