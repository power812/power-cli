import { CommonComponentProps } from '../defaultProps';
declare const useComponentCommon: (props: Readonly<Partial<CommonComponentProps & {
    isEditing: boolean;
}>>, picks: string[]) => {
    styleProps: import("vue").ComputedRef<any>;
    handleClick: () => void;
};
export default useComponentCommon;
